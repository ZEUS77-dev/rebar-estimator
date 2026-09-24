/** Converts a compiled BuildingGeometry's real-world-metre points back to
 *  image pixels, purely for drawing the inferred grid/columns over the
 *  photo the Studio traced them from - compileGeometry re-origins to the
 *  outline's own bounding box and never keeps this mapping, since the engine
 *  it feeds has no business knowing about the source image at all.
 *
 *  The inverse falls out of compile.js's own forward transform:
 *  outline[i] (m) = rawPoints[i] (px) / pxPerMetre - bbox(rawPoints/pxPerMetre).min
 *  and bbox commutes with a positive scalar, so bbox(rawPoints/pxPerMetre).min
 *  = bbox(rawPoints).min / pxPerMetre - giving a plain scale-and-offset back:
 *  rawPoints[i] = outline[i] * pxPerMetre + bbox(rawPoints).min */

import { dist, bbox } from '../../lib/geometry/polygon.js';
import { ftToM } from '../../lib/units.js';

export function scalePxPerMetre(scale) {
  if (!scale || !scale.a || !scale.b) return null;
  const pxLength = dist(scale.a, scale.b);
  const value = Number(scale.value);
  if (!Number.isFinite(pxLength) || pxLength <= 0) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  const realM = scale.unit === 'ft' ? ftToM(value) : value;
  return pxLength / realM;
}

/** Null when there isn't yet a usable scale or outline to anchor against. */
export function geometryToImageTransform(scale, outlinePoints) {
  const pxPerMetre = scalePxPerMetre(scale);
  if (!pxPerMetre || !outlinePoints || outlinePoints.length < 1) return null;
  const box = bbox(outlinePoints);
  return { pxPerMetre, originPx: { x: box.minX, y: box.minY } };
}

export function toImagePx([x, y], transform) {
  return [x * transform.pxPerMetre + transform.originPx.x, y * transform.pxPerMetre + transform.originPx.y];
}
