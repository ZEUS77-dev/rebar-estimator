import { describe, it, expect } from 'vitest';
import { compileGeometry } from './compile.js';

// A 10m x 10m square, traced at 10 px per metre (scale line: 100px = 10m).
// All fixtures below share this scale unless noted otherwise.
const SCALE = { a: [0, 0], b: [100, 0], value: 10, unit: 'm' };
const SQUARE_PX = [
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
];

function traceDoc(overrides = {}) {
  return {
    scale: SCALE,
    outline: { points: SQUARE_PX },
    columns: [],
    grid: {},
    storey: {},
    ...overrides,
  };
}

describe('compileGeometry - no columns placed', () => {
  const result = compileGeometry(traceDoc());

  it('compiles a plain square with an inferred grid', () => {
    expect(result).not.toBeNull();
    expect(result.source).toBe('grid');
    expect(result.columnsInferred).toBe(true);
    expect(result.grid.inferred).toBe(true);
  });

  it('gets the area and perimeter right', () => {
    expect(result.derived.areaSqM).toBeCloseTo(100, 9);
    expect(result.derived.perimeterM).toBeCloseTo(40, 9);
  });

  it('infers an evenly spaced grid at roughly the default 3.6m span', () => {
    // round(10 / 3.6) + 1 = 4 lines per axis.
    expect(result.grid.xs).toHaveLength(4);
    expect(result.grid.ys).toHaveLength(4);
  });

  it('places inferred columns at every grid node inside the outline', () => {
    // A convex square: all 4x4 = 16 grid nodes sit on or inside the boundary.
    expect(result.derived.columnCount).toBe(16);
  });

  it('defaults the storey height', () => {
    expect(result.storey.heightM).toBeCloseTo(3.0, 9);
  });

  it('scores a perfectly axis-aligned outline as fully orthogonal', () => {
    expect(result.quality.orthogonalityScore).toBeCloseTo(1, 9);
  });

  it('reports no scale-line fraction without image dimensions', () => {
    expect(result.quality.scaleLinePxFraction).toBeNull();
  });

  it('computes the scale-line fraction when the image size is known', () => {
    const withImage = compileGeometry(traceDoc({ image: { w: 1000, h: 1000 } }));
    // Reference line is 100px; the image diagonal is 1000*sqrt(2).
    expect(withImage.quality.scaleLinePxFraction).toBeCloseTo(100 / (1000 * Math.SQRT2), 6);
  });
});

describe('compileGeometry - columns placed', () => {
  it('clusters four corner columns into a real 2x2 grid', () => {
    const columns = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ];
    const result = compileGeometry(traceDoc({ columns }));
    expect(result.source).toBe('traced');
    expect(result.columnsInferred).toBe(false);
    expect(result.grid.xs).toEqual([0, 10]);
    expect(result.grid.ys).toEqual([0, 10]);
    expect(result.derived.columnCount).toBe(4);
  });

  it('falls back to an inferred grid when fewer than 4 columns are placed', () => {
    const columns = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];
    const result = compileGeometry(traceDoc({ columns }));
    expect(result.columnsInferred).toBe(true);
  });

  it('falls back to an inferred grid when placed columns collapse onto one line', () => {
    // Four columns all sharing the same x - clusterAxis(xs) collapses to a
    // single line, which cannot define a grid on its own.
    const columns = [
      { x: 50, y: 0 },
      { x: 50, y: 30 },
      { x: 50, y: 60 },
      { x: 50, y: 100 },
    ];
    const result = compileGeometry(traceDoc({ columns }));
    expect(result.columnsInferred).toBe(true);
  });
});

describe('compileGeometry - degeneracy', () => {
  it('rejects an outline with fewer than 3 points', () => {
    const result = compileGeometry(traceDoc({ outline: { points: [[0, 0], [10, 10]] } }));
    expect(result).toBeNull();
  });

  it('rejects a self-intersecting outline', () => {
    const bowtie = [
      [0, 0],
      [100, 100],
      [100, 0],
      [0, 100],
    ];
    const result = compileGeometry(traceDoc({ outline: { points: bowtie } }));
    expect(result).toBeNull();
  });

  it('rejects a sliver too small to be a real building', () => {
    // A 1m x 1m square at the same 10px/m scale - area 1 sq.m, under the floor.
    const sliver = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const result = compileGeometry(traceDoc({ outline: { points: sliver } }));
    expect(result).toBeNull();
  });

  it('rejects a missing scale', () => {
    const result = compileGeometry(traceDoc({ scale: null }));
    expect(result).toBeNull();
  });

  it('rejects a zero-length scale reference line', () => {
    const result = compileGeometry(traceDoc({ scale: { a: [0, 0], b: [0, 0], value: 10, unit: 'm' } }));
    expect(result).toBeNull();
  });

  it('rejects a zero or negative scale value', () => {
    const result = compileGeometry(traceDoc({ scale: { ...SCALE, value: 0 } }));
    expect(result).toBeNull();
  });

  it('never throws on a garbage traceDoc', () => {
    expect(() => compileGeometry(null)).not.toThrow();
    expect(() => compileGeometry({})).not.toThrow();
    expect(compileGeometry(null)).toBeNull();
    expect(compileGeometry({})).toBeNull();
  });
});

describe('compileGeometry - storey height', () => {
  it('carries a custom storey height through unchanged', () => {
    const result = compileGeometry(traceDoc({ storey: { heightM: 3.3 } }));
    expect(result.storey.heightM).toBeCloseTo(3.3, 9);
  });
});

describe('compileGeometry - feet scale', () => {
  it('converts a feet-denominated reference line correctly', () => {
    // Same 100px reference line, now declared as 32.8084 ft (~10m) instead of
    // 10m directly - the compiled geometry should come out equivalent.
    const ftResult = compileGeometry(traceDoc({ scale: { a: [0, 0], b: [100, 0], value: 32.8084, unit: 'ft' } }));
    expect(ftResult.derived.areaSqM).toBeCloseTo(100, 1);
  });
});
