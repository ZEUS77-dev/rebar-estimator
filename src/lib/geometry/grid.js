/** Turning a traced outline (and, optionally, some clicked column points) into
 *  a structural grid: line positions, interior beam run length, and slab
 *  panels. Everything here operates in real units (metres) - compile.js is
 *  the only thing that knows about image pixels.
 *
 *  All lengths/areas in, all lengths/areas out. No React, no pixels. */

import { dist, bbox, clipRectByPolygon, shoelaceArea } from './polygon.js';

const EPS = 1e-9;

/** Groups sorted axis values into grid lines by 1-D clustering: walk the
 *  sorted values, start a new group whenever the gap to the previous value
 *  exceeds a tolerance, and return each group's mean as one line position.
 *
 *  The tolerance itself is derived from the data rather than a fixed number,
 *  because a tight townhouse grid (2.5 m bays) and a wide hall (6 m bays)
 *  should not share one hardcoded snapping distance: it is the larger of an
 *  absolute floor (0.4 m - two columns closer than that are almost certainly
 *  one column clicked twice) and 15% of the median spacing between values. */
export function clusterAxis(values, { minTolM = 0.4, fraction = 0.15 } = {}) {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return [sorted[0]];

  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const mid = Math.floor(sortedGaps.length / 2);
  const medianGap =
    sortedGaps.length % 2 === 0 ? (sortedGaps[mid - 1] + sortedGaps[mid]) / 2 : sortedGaps[mid];
  const tol = Math.max(minTolM, fraction * medianGap);

  const groups = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const group = groups[groups.length - 1];
    if (sorted[i] - group[group.length - 1] <= tol) group.push(sorted[i]);
    else groups.push([sorted[i]]);
  }
  return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
}

/** Evenly-spaced grid lines across a bounding box at roughly `targetSpanM`,
 *  used when no columns have been placed at all. Always includes both
 *  boundary lines - a caller after only the INTERIOR lines should filter
 *  with interiorLines() below, the same way it would for a clustered grid. */
export function inferGrid(box, targetSpanM) {
  const make = (min, span) => {
    const n = Math.max(2, Math.round(span / targetSpanM) + 1);
    return Array.from({ length: n }, (_, i) => min + (span * i) / (n - 1));
  };
  return {
    xs: make(box.minX, box.w),
    ys: make(box.minY, box.h),
  };
}

/** Drops any line that coincides with the bounding box's own edge, within a
 *  small tolerance. The OUTER boundary of the traced outline is already
 *  counted as a beam by perimeter() - counting a grid line there again would
 *  double the edge beams. */
export function interiorLines(lines, min, max, tol = 0.05) {
  return lines.filter((v) => v > min + tol && v < max - tol);
}

/** Where a vertical line x=c cuts through the (possibly concave) polygon,
 *  using the same even-odd rule as point-in-polygon but applied along the
 *  whole line: collect every edge crossing, sort by the OTHER axis, and sum
 *  the alternating in/out intervals. Set `axis: 'y'` for a horizontal line
 *  y=c instead - the two are mirror images of each other. */
export function chordLength(coord, axis, points) {
  const n = points.length;
  const hits = [];
  const a = axis === 'x' ? 0 : 1; // the axis the line is drawn ALONG (fixed)
  const b = 1 - a; // the axis we are sweeping crossings over

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const c1 = p1[a];
    const c2 = p2[a];
    // Does this edge cross the line coord=c?
    if ((c1 <= coord && c2 > coord) || (c2 <= coord && c1 > coord)) {
      const t = (coord - c1) / (c2 - c1);
      hits.push(p1[b] + t * (p2[b] - p1[b]));
    }
  }
  hits.sort((x, y) => x - y);

  let total = 0;
  for (let i = 0; i + 1 < hits.length; i += 2) total += hits[i + 1] - hits[i];
  return total;
}

/** Perimeter (edge beams) plus the clipped length of every INTERIOR grid line
 *  (interior beams) - the boundary lines are excluded so they are not counted
 *  as both perimeter and grid. This is what correctly handles an L/U-shaped
 *  plan: a naive "grid lines x panel count" estimate would put a beam through
 *  the notched-out area that is not actually there. */
export function beamRunLength(outline, grid) {
  const box = bbox(outline);
  const interiorXs = interiorLines(grid.xs, box.minX, box.maxX);
  const interiorYs = interiorLines(grid.ys, box.minY, box.maxY);

  let total = perimeterOf(outline);
  for (const x of interiorXs) total += chordLength(x, 'x', outline);
  for (const y of interiorYs) total += chordLength(y, 'y', outline);
  return total;
}

// Local, not exported: pulling this in from polygon.js would be one more
// import for one call site's sake; a straight sum of edge lengths is short
// enough to keep here instead. Kept in sync with polygon.js's perimeter().
function perimeterOf(points) {
  const n = points.length;
  let total = 0;
  for (let i = 0; i < n; i++) total += dist(points[i], points[(i + 1) % n]);
  return total;
}

/** Every grid cell clipped to the outline, as a slab panel. Cells under
 *  0.5 sq m are dropped - a sliver where a cell barely grazes the outline is
 *  not a real bay, and would otherwise show up as a panel with a nonsensical
 *  span. Area-correct even where the CELL SHAPE is only approximate on a
 *  concave outline (see clipRectByPolygon) - the areas are what feed the
 *  engine, not the shapes. */
export function panelsFromGrid(outline, grid, { minAreaSqM = 0.5 } = {}) {
  const panels = [];
  for (let i = 0; i + 1 < grid.xs.length; i++) {
    for (let j = 0; j + 1 < grid.ys.length; j++) {
      const cellW = grid.xs[i + 1] - grid.xs[i];
      const cellH = grid.ys[j + 1] - grid.ys[j];
      if (cellW <= EPS || cellH <= EPS) continue;

      const clipped = clipRectByPolygon(
        { minX: grid.xs[i], minY: grid.ys[j], maxX: grid.xs[i + 1], maxY: grid.ys[j + 1] },
        outline,
      );
      const areaSqM = shoelaceArea(clipped);
      if (areaSqM < minAreaSqM) continue;

      const shortSpanM = Math.min(cellW, cellH);
      const longSpanM = Math.max(cellW, cellH);
      panels.push({ areaSqM, shortSpanM, longSpanM, twoWay: longSpanM / shortSpanM < 2 });
    }
  }
  return panels;
}
