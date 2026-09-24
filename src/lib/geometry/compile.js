/** The one-way door from a Plan Studio TraceDoc (image pixels, editing state,
 *  never seen by the engine) to a BuildingGeometry (real-world metres, the
 *  ~1-3 KB engine-facing shape estimator.js consumes). See the plan doc for
 *  the full rationale; the contract enforced here is narrower:
 *
 *  compileGeometry(traceDoc) -> BuildingGeometry | null
 *
 *  Never throws. A traced outline that is too small, self-intersecting, or
 *  missing a usable scale reference compiles to `null` - the engine's job is
 *  to fall back to area mode silently, not to crash or show a nonsense number.
 *
 *  Expected TraceDoc shape (only the fields this module reads):
 *  {
 *    scale: { a: [px, px], b: [px, px], value: number, unit: 'm' | 'ft' } | null,
 *    outline: { points: [[px, px], ...] },
 *    columns: [{ x: px, y: px }, ...],
 *    grid: { targetSpanM?: number },
 *    storey: { heightM?: number },
 *    image: { w: px, h: px } | undefined,   // only used for the quality score
 *  } */

import {
  bbox,
  shoelaceArea,
  perimeter,
  pointInPolygon,
  selfIntersects,
  normaliseWinding,
  dist,
} from './polygon.js';
import { clusterAxis, inferGrid, beamRunLength, panelsFromGrid } from './grid.js';
import { ftToM } from '../units.js';

const MIN_AREA_SQM = 3; // smaller than this is a misclick, not a traced building
const MIN_COLUMNS_FOR_GRID = 4; // fewer placed columns can't define two real grid lines
const DEFAULT_TARGET_SPAN_M = 3.6;
const DEFAULT_STOREY_HEIGHT_M = 3.0;

function scalePxPerMetre(scale) {
  if (!scale || !scale.a || !scale.b) return null;
  const pxLength = dist(scale.a, scale.b);
  if (!Number.isFinite(pxLength) || pxLength <= 0) return null;
  const value = Number(scale.value);
  if (!Number.isFinite(value) || value <= 0) return null;
  const realM = scale.unit === 'ft' ? ftToM(value) : value;
  return pxLength / realM;
}

/** Reference-line length as a fraction of the image diagonal - a short line
 *  drawn over a small part of a large image amplifies any click imprecision
 *  into a much larger area error. Feeds a confidence driver, not the geometry
 *  itself; null (rather than a guess) when the image size isn't known. */
function scaleLineFraction(scale, image) {
  if (!scale || !image || !Number.isFinite(image.w) || !Number.isFinite(image.h)) return null;
  const diagonal = Math.hypot(image.w, image.h);
  if (diagonal <= 0) return null;
  return dist(scale.a, scale.b) / diagonal;
}

/** Share of edges within 5 degrees of axis-aligned. Real floor plans are
 *  overwhelmingly orthogonal; a low score usually means an imprecise trace
 *  rather than a genuinely angled building, so it feeds a confidence driver. */
function orthogonalityScore(points) {
  const n = points.length;
  if (n < 3) return 0;
  let aligned = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) continue;
    const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI)) % 90;
    const distToAxis = Math.min(angle, 90 - angle);
    if (distToAxis <= 5) aligned++;
  }
  return aligned / n;
}

export function compileGeometry(traceDoc) {
  if (!traceDoc || !traceDoc.outline) return null;

  const pxPerMetre = scalePxPerMetre(traceDoc.scale);
  if (!Number.isFinite(pxPerMetre) || pxPerMetre <= 0) return null;

  const rawPoints = traceDoc.outline.points || [];
  if (rawPoints.length < 3) return null;

  const metrePoints = rawPoints.map(([x, y]) => [x / pxPerMetre, y / pxPerMetre]);
  if (selfIntersects(metrePoints)) return null;

  // Re-origin to the outline's own bounding box - a BuildingGeometry carries
  // no memory of where on the source image it was traced.
  const box = bbox(metrePoints);
  const outline = normaliseWinding(
    metrePoints.map(([x, y]) => [x - box.minX, y - box.minY]),
    true,
  );

  const areaSqM = shoelaceArea(outline);
  if (!Number.isFinite(areaSqM) || areaSqM < MIN_AREA_SQM) return null;

  const perimeterM = perimeter(outline);
  const outlineBox = bbox(outline);

  const placedColumns = (traceDoc.columns || [])
    .map((c) => [c.x / pxPerMetre - box.minX, c.y / pxPerMetre - box.minY])
    .filter((p) => pointInPolygon(p, outline));

  const targetSpanM = traceDoc.grid?.targetSpanM ?? DEFAULT_TARGET_SPAN_M;

  let grid;
  let columns;
  let columnsInferred;

  const clusteredXs = placedColumns.length >= MIN_COLUMNS_FOR_GRID
    ? clusterAxis(placedColumns.map((p) => p[0]))
    : [];
  const clusteredYs = placedColumns.length >= MIN_COLUMNS_FOR_GRID
    ? clusterAxis(placedColumns.map((p) => p[1]))
    : [];

  if (clusteredXs.length >= 2 && clusteredYs.length >= 2) {
    grid = { xs: clusteredXs, ys: clusteredYs, inferred: false };
    columns = placedColumns;
    columnsInferred = false;
  } else {
    const inferred = inferGrid(outlineBox, targetSpanM);
    grid = { ...inferred, inferred: true };
    columns = [];
    for (const x of inferred.xs) {
      for (const y of inferred.ys) {
        if (pointInPolygon([x, y], outline)) columns.push([x, y]);
      }
    }
    columnsInferred = true;
  }

  const beamRunM = beamRunLength(outline, grid);
  const panels = panelsFromGrid(outline, grid);
  const spans = panels.flatMap((p) => [p.shortSpanM, p.longSpanM]);
  const avgSpanM = spans.length ? spans.reduce((a, b) => a + b, 0) / spans.length : targetSpanM;
  const maxSpanM = spans.length ? Math.max(...spans) : targetSpanM;
  const columnCount = columns.length;

  return {
    version: 1,
    source: columnsInferred ? 'grid' : 'traced',
    outline,
    columns,
    columnsInferred,
    grid,
    storey: { heightM: traceDoc.storey?.heightM ?? DEFAULT_STOREY_HEIGHT_M },
    derived: {
      areaSqM,
      perimeterM,
      columnCount,
      beamRunM,
      panels,
      avgSpanM,
      maxSpanM,
      tributaryAreaSqM: columnCount ? areaSqM / columnCount : areaSqM,
    },
    quality: {
      scaleLinePxFraction: scaleLineFraction(traceDoc.scale, traceDoc.image),
      vertexCount: outline.length,
      selfIntersecting: false,
      orthogonalityScore: orthogonalityScore(outline),
    },
  };
}
