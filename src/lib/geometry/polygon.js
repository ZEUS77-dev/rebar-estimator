/** Pure 2-D polygon math, unit-agnostic.
 *
 *  Every function here takes a polygon as a plain array of [x, y] pairs,
 *  CLOSED IMPLICITLY - the first point is never repeated at the end, and
 *  every function that walks the edges wraps from the last point back to the
 *  first itself. This is the convention `BuildingGeometry.outline` uses
 *  throughout the rest of the geometry module.
 *
 *  No React, no units, no knowledge of pixels or metres - a caller converts
 *  before handing points in here, and this module never looks at scale. */

export function dist(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Signed area via the shoelace formula. Positive for a counter-clockwise
 *  polygon (in the usual maths orientation, +y up), negative for clockwise -
 *  screen/SVG coordinates have +y DOWN, which flips the sign convention but
 *  not the magnitude, so callers should only rely on the SIGN to detect
 *  winding direction relative to their own coordinate space, never assume
 *  which one means "counter-clockwise on screen". */
export function signedArea(points) {
  const n = points.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/** Unsigned area - what every caller outside this module actually wants. */
export function shoelaceArea(points) {
  if (points.length < 3) return 0;
  return Math.abs(signedArea(points));
}

/** Sum of edge lengths around the closed loop. */
export function perimeter(points) {
  const n = points.length;
  if (n < 2) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) total += dist(points[i], points[(i + 1) % n]);
  return total;
}

export function bbox(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** Even-odd ray-casting test. Points exactly on an edge are treated as
 *  inside - it matters more here that a grid node sitting on the wall does
 *  not get thrown away than that the boundary case is mathematically pure. */
export function pointInPolygon([px, py], points) {
  const n = points.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    // Standard even-odd crossing test.
    const crosses = yi > py !== yj > py;
    if (crosses) {
      const xCross = xi + ((py - yi) / (yj - yi)) * (xj - xi);
      if (px < xCross) inside = !inside;
      else if (px === xCross) return true; // on the edge - count as inside
    } else if ((py === yi && py === yj) || (px === xi && px === xj)) {
      // Degenerate: point lies on a horizontal/vertical edge segment.
      const onSeg =
        Math.min(xi, xj) <= px && px <= Math.max(xi, xj) &&
        Math.min(yi, yj) <= py && py <= Math.max(yi, yj);
      if (onSeg && (py === yi || px === xi)) return true;
    }
  }
  return inside;
}

/** True if segment p1->p2 and p3->p4 cross. Orientation-based, with explicit
 *  collinear handling - the naive cross-product test alone misses the
 *  "collinear but overlapping" case, which a hand-traced outline can easily
 *  produce (three near-collinear clicks on what should be one straight wall). */
function segmentsIntersect(p1, p2, p3, p4) {
  const orient = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  const onSegment = (a, b, c) =>
    Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);

  const o1 = orient(p1, p2, p3);
  const o2 = orient(p1, p2, p4);
  const o3 = orient(p3, p4, p1);
  const o4 = orient(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  // Collinear special cases: one endpoint lying ON the other segment.
  if (o1 === 0 && onSegment(p1, p2, p3)) return true;
  if (o2 === 0 && onSegment(p1, p2, p4)) return true;
  if (o3 === 0 && onSegment(p3, p4, p1)) return true;
  if (o4 === 0 && onSegment(p3, p4, p2)) return true;

  return false;
}

/** True if any two NON-ADJACENT edges of the closed polygon cross. Adjacent
 *  edges always share an endpoint, which is not a self-intersection, so they
 *  are skipped rather than reported. This is the guard compile.js relies on
 *  to refuse a traced outline that would otherwise give shoelaceArea a
 *  plausible-looking but wrong answer (areas partially cancelling out). */
export function selfIntersects(points) {
  const n = points.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      // Skip the edge itself and the two edges adjacent to it (which share a
      // vertex with edge i and would "intersect" there trivially).
      if (j === i) continue;
      const adjacent = j === (i + 1) % n || (j + 1) % n === i;
      if (adjacent) continue;
      const b1 = points[j];
      const b2 = points[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

/** Reverses point order if needed so the polygon winds in the requested
 *  direction, judged by the SIGN of signedArea in this coordinate space
 *  (positive = one direction, negative = the other - see signedArea's note
 *  on why this module never labels a sign "clockwise" or "counter-clockwise"
 *  in absolute terms). Idempotent: normalising an already-correct polygon
 *  returns it unchanged. */
export function normaliseWinding(points, positive = true) {
  const area = signedArea(points);
  const isPositive = area >= 0;
  return isPositive === positive ? points : [...points].reverse();
}

/** Sutherland-Hodgman: clips `subject` (any simple polygon, convex or not)
 *  against a convex AXIS-ALIGNED rectangle. Exact for area even when the
 *  subject is concave, which is what lets a slab panel be clipped against an
 *  L-shaped outline and still get its area right - the resulting SHAPE can be
 *  a rough approximation on a concave subject, but the area is not.
 *
 *  The area is the contract to rely on, not the vertex list: when the clip
 *  rectangle sits fully outside the subject this returns a clean empty array,
 *  but when it exactly coincides with a concave notch in the subject's own
 *  boundary, it can instead return a degenerate list of points tracing that
 *  boundary with zero enclosed area. Both are "no real overlap" - always
 *  read the result through shoelaceArea(), never through its length alone. */
export function clipRectByPolygon(rect, subject) {
  const { minX, minY, maxX, maxY } = rect;
  // Each edge of the clip rectangle, wound consistently, with an "inside"
  // test specific to that edge.
  const edges = [
    { inside: (p) => p[0] >= minX, clip: 'left' },
    { inside: (p) => p[0] <= maxX, clip: 'right' },
    { inside: (p) => p[1] >= minY, clip: 'top' },
    { inside: (p) => p[1] <= maxY, clip: 'bottom' },
  ];

  const intersect = (a, b, clip) => {
    const [ax, ay] = a;
    const [bx, by] = b;
    switch (clip) {
      case 'left': {
        const t = (minX - ax) / (bx - ax);
        return [minX, ay + t * (by - ay)];
      }
      case 'right': {
        const t = (maxX - ax) / (bx - ax);
        return [maxX, ay + t * (by - ay)];
      }
      case 'top': {
        const t = (minY - ay) / (by - ay);
        return [ax + t * (bx - ax), minY];
      }
      case 'bottom': {
        const t = (maxY - ay) / (by - ay);
        return [ax + t * (bx - ax), maxY];
      }
      default:
        return a;
    }
  };

  let output = subject;
  for (const edge of edges) {
    if (output.length === 0) break;
    const input = output;
    output = [];
    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      const previous = input[(i - 1 + input.length) % input.length];
      const currentIn = edge.inside(current);
      const previousIn = edge.inside(previous);
      if (currentIn) {
        if (!previousIn) output.push(intersect(previous, current, edge.clip));
        output.push(current);
      } else if (previousIn) {
        output.push(intersect(previous, current, edge.clip));
      }
    }
  }
  return output;
}
