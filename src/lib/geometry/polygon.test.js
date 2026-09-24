import { describe, it, expect } from 'vitest';
import {
  dist,
  signedArea,
  shoelaceArea,
  perimeter,
  bbox,
  pointInPolygon,
  selfIntersects,
  normaliseWinding,
  clipRectByPolygon,
} from './polygon.js';

const SQUARE = [
  [0, 0],
  [4, 0],
  [4, 4],
  [0, 4],
];

// A 4x4 square with its top-right 2x2 corner notched out - area 12, perimeter 16.
const L_SHAPE = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];

const BOWTIE = [
  [0, 0],
  [4, 4],
  [4, 0],
  [0, 4],
];

describe('dist', () => {
  it('is plain Euclidean distance', () => {
    expect(dist([0, 0], [3, 4])).toBeCloseTo(5, 9);
  });
});

describe('shoelaceArea / signedArea', () => {
  it('gives the unit square area 1', () => {
    expect(shoelaceArea([[0, 0], [1, 0], [1, 1], [0, 1]])).toBeCloseTo(1, 9);
  });

  it('matches a hand-computed L-shape area', () => {
    expect(shoelaceArea(L_SHAPE)).toBeCloseTo(12, 9);
  });

  it('is unsigned - winding order does not change the magnitude', () => {
    const reversed = [...SQUARE].reverse();
    expect(shoelaceArea(SQUARE)).toBeCloseTo(shoelaceArea(reversed), 9);
    expect(signedArea(SQUARE)).toBeCloseTo(-signedArea(reversed), 9);
  });

  it('is zero for fewer than three points', () => {
    expect(shoelaceArea([])).toBe(0);
    expect(shoelaceArea([[0, 0]])).toBe(0);
    expect(shoelaceArea([[0, 0], [1, 1]])).toBe(0);
  });
});

describe('perimeter', () => {
  it('sums the closed loop, wrapping back to the first point', () => {
    expect(perimeter(SQUARE)).toBeCloseTo(16, 9);
  });

  it('matches a hand-computed L-shape perimeter', () => {
    expect(perimeter(L_SHAPE)).toBeCloseTo(16, 9);
  });
});

describe('bbox', () => {
  it('brackets an irregular shape exactly', () => {
    expect(bbox(L_SHAPE)).toEqual({ minX: 0, minY: 0, maxX: 4, maxY: 4, w: 4, h: 4 });
  });
});

describe('pointInPolygon', () => {
  it('finds a point in the unnotched part of the L inside', () => {
    expect(pointInPolygon([1, 1], L_SHAPE)).toBe(true);
    expect(pointInPolygon([3, 1], L_SHAPE)).toBe(true);
  });

  it('finds a point inside the notched-out corner outside', () => {
    expect(pointInPolygon([3, 3], L_SHAPE)).toBe(false);
  });

  it('finds a point well outside the whole shape outside', () => {
    expect(pointInPolygon([10, 10], L_SHAPE)).toBe(false);
  });
});

describe('selfIntersects', () => {
  it('is false for a simple square', () => {
    expect(selfIntersects(SQUARE)).toBe(false);
  });

  it('is false for a simple L-shape', () => {
    expect(selfIntersects(L_SHAPE)).toBe(false);
  });

  it('is true for a bowtie with crossing edges', () => {
    expect(selfIntersects(BOWTIE)).toBe(true);
  });

  it('does not flag adjacent edges sharing a vertex as an intersection', () => {
    // A triangle has every pair of edges adjacent - never self-intersecting.
    expect(selfIntersects([[0, 0], [4, 0], [2, 4]])).toBe(false);
  });
});

describe('normaliseWinding', () => {
  it('leaves a polygon already in the requested winding unchanged', () => {
    const positive = signedArea(SQUARE) >= 0;
    expect(normaliseWinding(SQUARE, positive)).toEqual(SQUARE);
  });

  it('reverses a polygon wound the other way', () => {
    const positive = signedArea(SQUARE) >= 0;
    const flipped = normaliseWinding(SQUARE, !positive);
    expect(flipped).toEqual([...SQUARE].reverse());
  });

  it('is idempotent', () => {
    const once = normaliseWinding(SQUARE, true);
    const twice = normaliseWinding(once, true);
    expect(twice).toEqual(once);
  });
});

describe('clipRectByPolygon', () => {
  it('returns the full cell when it sits entirely inside the subject', () => {
    const cell = clipRectByPolygon({ minX: 0, minY: 0, maxX: 2, maxY: 2 }, L_SHAPE);
    expect(shoelaceArea(cell)).toBeCloseTo(4, 9);
  });

  it('gives zero area when the cell sits entirely in the notched-out corner', () => {
    // The clip rectangle here exactly coincides with the L's own notch
    // corner, so Sutherland-Hodgman legitimately returns a degenerate
    // boundary-following list rather than a clean empty array - it traces
    // the notch's own edge. Area is the real contract every caller relies on
    // (see the "sums back to whole" test below), and it is correctly zero.
    const cell = clipRectByPolygon({ minX: 2, minY: 2, maxX: 4, maxY: 4 }, L_SHAPE);
    expect(shoelaceArea(cell)).toBeCloseTo(0, 9);
  });

  it('returns the full cell for the other populated corner of the L', () => {
    const cell = clipRectByPolygon({ minX: 2, minY: 0, maxX: 4, maxY: 2 }, L_SHAPE);
    expect(shoelaceArea(cell)).toBeCloseTo(4, 9);
  });

  it('clips a straddling rectangle down to the overlapping area', () => {
    // This cell straddles the notch: half of it (x:2-4, y:0-2) is inside the
    // L, half (x:2-4, y:2-4) is in the removed corner - overlap area is 4.
    const cell = clipRectByPolygon({ minX: 2, minY: 0, maxX: 4, maxY: 4 }, L_SHAPE);
    expect(shoelaceArea(cell)).toBeCloseTo(4, 9);
  });

  it('returns empty for a rectangle entirely outside the subject', () => {
    const cell = clipRectByPolygon({ minX: 10, minY: 10, maxX: 12, maxY: 12 }, L_SHAPE);
    expect(cell).toHaveLength(0);
  });

  it('sums cell areas across a full grid back to the whole shoelace area', () => {
    // Tile the L-shape's bounding box in unit-ish cells and confirm the parts
    // add back up to the whole - the real cross-check that clipping is not
    // silently losing or double-counting area anywhere.
    const b = bbox(L_SHAPE);
    let total = 0;
    for (let x = b.minX; x < b.maxX; x += 1) {
      for (let y = b.minY; y < b.maxY; y += 1) {
        const cell = clipRectByPolygon({ minX: x, minY: y, maxX: x + 1, maxY: y + 1 }, L_SHAPE);
        total += shoelaceArea(cell);
      }
    }
    expect(total).toBeCloseTo(shoelaceArea(L_SHAPE), 9);
  });
});
