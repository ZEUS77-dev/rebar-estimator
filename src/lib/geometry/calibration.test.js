/** The Phase 2B calibration STOP GATE: geometry mode's nominal engineering
 *  rates, once corrected by assumptions.geometryCalibration, must agree with
 *  the area-rate model on the anchor case, converge on other plain
 *  rectangles, stay in the residential band for typical geometries, and move
 *  in the right direction as span/column-count/storeys change. See
 *  assumptions.js's geometryCalibration comment for how the multipliers were
 *  derived and why a 1.4-1.8x nominal-rate gap was judged to be an
 *  under-tuned constant, not a modelling bug. */
import { describe, it, expect } from 'vitest';
import { estimate } from '../estimator.js';
import { compileGeometry } from './compile.js';
import { PLANS_BY_ID } from '../../data/floorPlans.js';

const plan2bhk = PLANS_BY_ID['fp-05'];

function rectGeometry(W, H, { targetSpanM = 3.6, heightM = 3.0, pxPerM = 10 } = {}) {
  return compileGeometry({
    scale: { a: [0, 0], b: [W * pxPerM, 0], value: W, unit: 'm' },
    outline: { points: [[0, 0], [W * pxPerM, 0], [W * pxPerM, H * pxPerM], [0, H * pxPerM]] },
    columns: [],
    grid: { targetSpanM },
    storey: { heightM },
  });
}

// The anchor case from the Phase 2 plan: the existing 1356 sq.ft / G+1 villa,
// modelled as a plain 12.6 x 10 m rectangle (126 sq.m) with the default 3.6 m
// inferred grid - exactly what geometryCalibration was tuned against.
const ANCHOR_BASE = { areaSqFt: 1356.25, areaUnit: 'sqft', floors: 'G+1', plan: plan2bhk, scope: 'full' };
const ANCHOR_GEOMETRY = rectGeometry(12.6, 10.0);

function netKgByElement(result) {
  return Object.fromEntries(result.byElement.map((e) => [e.element, e.netKg]));
}

describe('calibration - anchor parity', () => {
  const areaResult = estimate(ANCHOR_BASE);
  const geoResult = estimate({ ...ANCHOR_BASE, buildingGeometry: ANCHOR_GEOMETRY });
  const area = netKgByElement(areaResult);
  const geo = netKgByElement(geoResult);

  it('column, beam and slab agree with the area-rate model within 1% on the anchor', () => {
    for (const el of ['column', 'beam', 'slab']) {
      expect(geo[el] / area[el]).toBeCloseTo(1, 1);
      expect(Math.abs(geo[el] / area[el] - 1)).toBeLessThan(0.01);
    }
  });

  it('leaves footing and misc completely untouched on the anchor', () => {
    for (const el of ['footing', 'misc']) {
      expect(geo[el]).toBeCloseTo(area[el], 9);
    }
  });
});

describe('calibration - convergence on a different plain rectangle', () => {
  it('lands within 10% of area mode for a different size and aspect ratio', () => {
    const base = { areaSqFt: 2000, areaUnit: 'sqft', floors: 'G+1', plan: plan2bhk, scope: 'full' };
    const geometry = rectGeometry(14.14, 14.14);
    const areaResult = estimate(base);
    const geoResult = estimate({ ...base, buildingGeometry: geometry });
    const ratio = geoResult.totals.netKg / areaResult.totals.netKg;
    expect(Math.abs(ratio - 1)).toBeLessThan(0.1);
  });
});

describe('calibration - band', () => {
  for (const floors of ['G', 'G+1', 'G+2']) {
    it(`${floors} on the anchor rectangle lands in the 3.5-4.5 kg/sq.ft band`, () => {
      const geometry = rectGeometry(12.6, 10.0);
      const r = estimate({ ...ANCHOR_BASE, floors, buildingGeometry: geometry });
      expect(r.totals.kgPerSqFtBuiltUp).toBeGreaterThanOrEqual(3.5);
      expect(r.totals.kgPerSqFtBuiltUp).toBeLessThanOrEqual(4.5);
    });
  }
});

describe('calibration - monotonicity', () => {
  it('a longer span carries more slab steel than a shorter one, same footprint', () => {
    const shortSpan = estimate({
      ...ANCHOR_BASE,
      buildingGeometry: rectGeometry(12.6, 10.0, { targetSpanM: 2.8 }),
    });
    const longSpan = estimate({
      ...ANCHOR_BASE,
      buildingGeometry: rectGeometry(12.6, 10.0, { targetSpanM: 5.5 }),
    });
    const slabKg = (r) => r.byElement.find((e) => e.element === 'slab').netKg;
    expect(slabKg(longSpan)).toBeGreaterThan(slabKg(shortSpan));
  });

  it('more columns at a fixed footprint carries more column steel', () => {
    const fewerColumns = estimate({
      ...ANCHOR_BASE,
      buildingGeometry: rectGeometry(12.6, 10.0, { targetSpanM: 5.5 }),
    });
    const moreColumns = estimate({
      ...ANCHOR_BASE,
      buildingGeometry: rectGeometry(12.6, 10.0, { targetSpanM: 2.8 }),
    });
    const columnKg = (r) => r.byElement.find((e) => e.element === 'column').netKg;
    expect(columnKg(moreColumns)).toBeGreaterThan(columnKg(fewerColumns));
  });

  it('taller storeys carry proportionally more column steel', () => {
    const g1 = estimate({ ...ANCHOR_BASE, floors: 'G+1', buildingGeometry: ANCHOR_GEOMETRY });
    const g3 = estimate({ ...ANCHOR_BASE, floors: 'G+3', buildingGeometry: ANCHOR_GEOMETRY });
    const columnKg = (r) => r.byElement.find((e) => e.element === 'column').netKg;
    expect(columnKg(g3)).toBeGreaterThan(columnKg(g1));
  });
});

describe('calibration - degeneracy falls back to area mode', () => {
  it('a compileGeometry failure (null) behaves exactly like no geometry at all', () => {
    const failedTrace = { scale: null, outline: { points: [[0, 0], [1, 0], [1, 1]] } };
    const geometry = compileGeometry(failedTrace);
    expect(geometry).toBeNull();

    const withNull = estimate({ ...ANCHOR_BASE, buildingGeometry: geometry });
    const withoutKey = estimate(ANCHOR_BASE);
    expect(withNull.confidence.basis).toBe('area');
    expect(withNull.totals.netKg).toBeCloseTo(withoutKey.totals.netKg, 9);
  });
});
