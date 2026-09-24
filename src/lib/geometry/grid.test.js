import { describe, it, expect } from 'vitest';
import { bbox, shoelaceArea, perimeter } from './polygon.js';
import {
  clusterAxis,
  inferGrid,
  interiorLines,
  chordLength,
  beamRunLength,
  panelsFromGrid,
} from './grid.js';

const SQUARE = [
  [0, 0],
  [4, 0],
  [4, 4],
  [0, 4],
];

// Same L-shape as polygon.test.js: a 4x4 square, top-right 2x2 corner notched
// out. Area 12, and the notch sits exactly at x:[2,4] y:[2,4].
const L_SHAPE = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];

describe('clusterAxis', () => {
  it('is empty for no values and a singleton for one', () => {
    expect(clusterAxis([])).toEqual([]);
    expect(clusterAxis([5])).toEqual([5]);
  });

  it('merges two near-duplicate clicks into one line at their mean', () => {
    // 3.6 and 3.65 are 5cm apart - almost certainly one column clicked twice,
    // against a real ~3.6-3.6m grid elsewhere in the same set.
    const lines = clusterAxis([0, 3.6, 3.65, 7.2, 10.8]);
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBeCloseTo(3.625, 9);
  });

  it('keeps a genuinely tight but real grid distinct from noise', () => {
    // A small, consistent townhouse-scale grid (2.5m bays) should not merge
    // into one line just because the spacing is smaller than a villa's.
    const lines = clusterAxis([0, 2.5, 5, 7.5, 10]);
    expect(lines).toHaveLength(5);
  });
});

describe('inferGrid', () => {
  it('subdivides a span into evenly spaced lines at roughly the target', () => {
    const grid = inferGrid({ minX: 0, minY: 0, w: 10, h: 10 }, 3.6);
    expect(grid.xs[0]).toBeCloseTo(0, 9);
    expect(grid.xs[grid.xs.length - 1]).toBeCloseTo(10, 9);
    expect(grid.xs).toHaveLength(4);
    // Evenly spaced - every gap between consecutive lines is the same.
    const gaps = grid.xs.slice(1).map((x, i) => x - grid.xs[i]);
    for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 9);
  });

  it('never produces fewer than the two boundary lines, however small the span', () => {
    const grid = inferGrid({ minX: 0, minY: 0, w: 3, h: 3 }, 10);
    expect(grid.xs).toEqual([0, 3]);
    expect(grid.ys).toEqual([0, 3]);
  });
});

describe('interiorLines', () => {
  it('drops the two boundary lines and keeps everything strictly between', () => {
    expect(interiorLines([0, 3.333, 6.667, 10], 0, 10)).toEqual([3.333, 6.667]);
  });

  it('is empty when every line IS a boundary', () => {
    expect(interiorLines([0, 10], 0, 10)).toEqual([]);
  });
});

describe('chordLength', () => {
  it('spans the full height where the L-shape has no notch', () => {
    // x=1 is left of the notch (which only removes x:[2,4]) - full 0-4 depth.
    expect(chordLength(1, 'x', L_SHAPE)).toBeCloseTo(4, 9);
  });

  it('is cut short exactly where the notch removes material', () => {
    // x=3 is inside the notch's x-range - only y:[0,2] remains.
    expect(chordLength(3, 'x', L_SHAPE)).toBeCloseTo(2, 9);
  });

  it('agrees for the mirror-image horizontal case', () => {
    // y=1 is below the notch (which only removes y:[2,4]) - full 0-4 width.
    expect(chordLength(1, 'y', L_SHAPE)).toBeCloseTo(4, 9);
    // y=3 is inside the notch's y-range - only x:[0,2] remains.
    expect(chordLength(3, 'y', L_SHAPE)).toBeCloseTo(2, 9);
  });

  it('is zero for a line that misses the shape entirely', () => {
    expect(chordLength(100, 'x', SQUARE)).toBe(0);
  });
});

describe('beamRunLength', () => {
  it('is exactly the perimeter when the grid has no interior lines', () => {
    const grid = { xs: [0, 4], ys: [0, 4] };
    expect(beamRunLength(SQUARE, grid)).toBeCloseTo(perimeter(SQUARE), 9);
  });

  it('adds one full-length chord per interior line on a plain square', () => {
    const grid = { xs: [0, 2, 4], ys: [0, 2, 4] };
    // perimeter 16, plus one vertical (length 4) and one horizontal (length 4)
    // interior line, each spanning the square's full 4-unit width/height.
    expect(beamRunLength(SQUARE, grid)).toBeCloseTo(16 + 4 + 4, 9);
  });

  it('shortens the interior run where the outline is notched, not just the edge', () => {
    // Same 3x3 grid on the L-shape: the interior lines pass through the notch
    // and must come back shorter than the plain-square case above, since the
    // notch removes real interior area, not just perimeter.
    const grid = { xs: [0, 2, 4], ys: [0, 2, 4] };
    const squareTotal = beamRunLength(SQUARE, grid);
    const lTotal = beamRunLength(L_SHAPE, grid);
    expect(lTotal).toBeLessThan(squareTotal);
  });
});

describe('panelsFromGrid', () => {
  it('splits a plain square into panels whose areas sum back to the whole', () => {
    const grid = { xs: [0, 2, 4], ys: [0, 2, 4] };
    const panels = panelsFromGrid(SQUARE, grid);
    expect(panels).toHaveLength(4);
    const total = panels.reduce((a, p) => a + p.areaSqM, 0);
    expect(total).toBeCloseTo(shoelaceArea(SQUARE), 9);
    for (const p of panels) {
      expect(p.shortSpanM).toBeCloseTo(2, 9);
      expect(p.longSpanM).toBeCloseTo(2, 9);
      expect(p.twoWay).toBe(true);
    }
  });

  it('drops the cell that falls entirely in a notched-out corner', () => {
    const grid = { xs: [0, 2, 4], ys: [0, 2, 4] };
    const panels = panelsFromGrid(L_SHAPE, grid);
    // 4 cells total, one of them the empty notch - only 3 real panels.
    expect(panels).toHaveLength(3);
    const total = panels.reduce((a, p) => a + p.areaSqM, 0);
    expect(total).toBeCloseTo(shoelaceArea(L_SHAPE), 9);
  });

  it('flags long thin panels as one-way, not two-way', () => {
    // A 7m x 2m bay (ratio 3.5) is a textbook one-way slab; a 1m x 2m bay
    // (ratio 2, right at the boundary) stays alongside it as the contrast.
    const grid = { xs: [0, 1, 8], ys: [0, 2] };
    const wide = [
      [0, 0],
      [8, 0],
      [8, 2],
      [0, 2],
    ];
    const panels = panelsFromGrid(wide, grid);
    const longOne = panels.find((p) => p.longSpanM > 5);
    expect(longOne.twoWay).toBe(false);
  });

  it('discards a sliver cell under the minimum panel area', () => {
    const grid = { xs: [0, 0.1, 4], ys: [0, 4] };
    const panels = panelsFromGrid(SQUARE, grid, { minAreaSqM: 0.5 });
    // The 0.1-wide sliver (area 0.4) must be dropped; the remaining ~3.9-wide
    // panel (area ~15.6) must not be.
    expect(panels.every((p) => p.areaSqM >= 0.5)).toBe(true);
    expect(panels.some((p) => p.areaSqM > 15)).toBe(true);
  });
});
