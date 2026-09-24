import { describe, it, expect } from 'vitest';
import { estimate, elementKg } from './estimator.js';
import { DEFAULT_ASSUMPTIONS } from '../data/assumptions.js';
import { PLANS_BY_ID } from '../data/floorPlans.js';

const plan2bhk = PLANS_BY_ID['fp-05'];
const base = { areaSqFt: 1356.25, areaUnit: 'sqft', floors: 'G+1', plan: plan2bhk, scope: 'full' };

// A clean, hand-built BuildingGeometry - not run through compileGeometry, since
// elementKg/estimate trust the compiled shape as data and this fixture is
// deliberately round-numbered so every formula below is hand-verifiable.
const GEOMETRY = {
  version: 1,
  source: 'traced',
  outline: [[0, 0], [10, 0], [10, 10], [0, 10]],
  columns: [[0, 0], [10, 0], [0, 10], [10, 10]],
  columnsInferred: false,
  grid: { xs: [0, 10], ys: [0, 10], inferred: false },
  storey: { heightM: 3 },
  derived: {
    areaSqM: 50,
    perimeterM: 40,
    columnCount: 4,
    beamRunM: 40,
    panels: [
      { areaSqM: 25, shortSpanM: 4, longSpanM: 4, twoWay: true },
      { areaSqM: 25, shortSpanM: 4, longSpanM: 4, twoWay: true },
    ],
    avgSpanM: 4,
    maxSpanM: 4,
  },
  quality: {
    scaleLinePxFraction: 0.5,
    vertexCount: 4,
    selfIntersecting: false,
    orthogonalityScore: 1,
  },
};

const elArgs = (overrides = {}) => ({
  footprintSqFt: 1000,
  levels: 1,
  planFactor: 1,
  assumptions: DEFAULT_ASSUMPTIONS,
  ...overrides,
});

describe('elementKg - geometry mode', () => {
  const { column: columnCal, beam: beamCal, slab: slabCal } = DEFAULT_ASSUMPTIONS.geometryCalibration;

  it('computes column kg from column count, storey height and the geometry rate', () => {
    const kg = elementKg('column', elArgs({ buildingGeometry: GEOMETRY }));
    // 4 columns x 3 m x 10 kg/m x levelFactorSum(1 level) x lateral(1) x calibration
    expect(kg).toBeCloseTo(4 * 3 * 10 * columnCal, 9);
  });

  it('computes beam kg from the beam run length and the geometry rate', () => {
    const kg = elementKg('beam', elArgs({ buildingGeometry: GEOMETRY }));
    expect(kg).toBeCloseTo(40 * 10 * beamCal, 9);
  });

  it('computes slab kg from panel areas and span-scaled rate', () => {
    const kg = elementKg('slab', elArgs({ buildingGeometry: GEOMETRY }));
    const { slabKgPerSqMBase, slabSpanRefM, slabSpanExponent } = DEFAULT_ASSUMPTIONS.geometryRates;
    const perSqM = slabKgPerSqMBase * (4 / slabSpanRefM) ** slabSpanExponent;
    expect(kg).toBeCloseTo(2 * 25 * perSqM * slabCal, 6);
  });

  it('falls back to area x avg-span rate when every panel is degenerate', () => {
    const noPanels = { ...GEOMETRY, derived: { ...GEOMETRY.derived, panels: [] } };
    const kg = elementKg('slab', elArgs({ buildingGeometry: noPanels }));
    const { slabKgPerSqMBase, slabSpanRefM, slabSpanExponent } = DEFAULT_ASSUMPTIONS.geometryRates;
    const perSqM = slabKgPerSqMBase * (4 / slabSpanRefM) ** slabSpanExponent;
    expect(kg).toBeCloseTo(50 * perSqM * slabCal, 6);
  });

  it('leaves footing and misc on the area-rate model regardless of geometry', () => {
    for (const el of ['footing', 'misc']) {
      const withoutGeometry = elementKg(el, elArgs({ levels: 3 }));
      const withGeometry = elementKg(el, elArgs({ levels: 3, buildingGeometry: GEOMETRY }));
      expect(withGeometry).toBeCloseTo(withoutGeometry, 9);
    }
  });

  it('suppresses planFactor for geometry-computed elements', () => {
    for (const el of ['column', 'beam', 'slab']) {
      const low = elementKg(el, elArgs({ planFactor: 1.0, buildingGeometry: GEOMETRY }));
      const high = elementKg(el, elArgs({ planFactor: 1.08, buildingGeometry: GEOMETRY }));
      expect(high).toBeCloseTo(low, 9);
    }
  });

  it('still applies the area-mode plan factor when geometry is absent', () => {
    const low = elementKg('column', elArgs({ planFactor: 1.0 }));
    const high = elementKg('column', elArgs({ planFactor: 1.08 }));
    expect(high).toBeGreaterThan(low);
  });

  it('still applies the lateral surcharge above the threshold in geometry mode', () => {
    const levels = DEFAULT_ASSUMPTIONS.lateralThresholdLevels + 2;
    const withLateral = elementKg('column', elArgs({ levels, buildingGeometry: GEOMETRY }));
    const noLateralAssumptions = {
      ...DEFAULT_ASSUMPTIONS,
      lateralSurchargePerLevelAboveThreshold: 0,
    };
    const withoutLateral = elementKg(
      'column',
      elArgs({ levels, assumptions: noLateralAssumptions, buildingGeometry: GEOMETRY }),
    );
    const expectedSurcharge = 1 + 2 * DEFAULT_ASSUMPTIONS.lateralSurchargePerLevelAboveThreshold;
    expect(withLateral / withoutLateral).toBeCloseTo(expectedSurcharge, 9);
  });
});

describe('estimate() - geometry mode is purely additive', () => {
  it('is byte-for-byte unchanged when buildingGeometry is omitted or null', () => {
    // meta.generatedAt is a fresh Date.now() call on each side and is
    // expected to differ by a millisecond or two - everything else must not.
    const strip = (r) => ({ ...r, meta: { ...r.meta, generatedAt: null } });
    const withoutKey = estimate(base);
    const withNull = estimate({ ...base, buildingGeometry: null });
    expect(strip(withNull)).toEqual(strip(withoutKey));
  });

  it('reports basis "geometry" and carries the geometry through result.geometry', () => {
    const r = estimate({ ...base, buildingGeometry: GEOMETRY });
    expect(r.ok).toBe(true);
    expect(r.confidence.basis).toBe('geometry');
    expect(r.geometry.buildingGeometry).toBe(GEOMETRY);
  });
});

describe('estimate() - geometry confidence drivers', () => {
  const RISKY_GEOMETRY = {
    ...GEOMETRY,
    columnsInferred: true,
    derived: { ...GEOMETRY.derived, maxSpanM: 6 },
    quality: { ...GEOMETRY.quality, orthogonalityScore: 0.5, scaleLinePxFraction: 0.05 },
  };

  it('flags an inferred grid, an out-of-range span, low orthogonality and a short scale line', () => {
    const r = estimate({ ...base, buildingGeometry: RISKY_GEOMETRY });
    const codes = r.confidence.drivers.map((d) => d.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'INFERRED_GRID',
        'SPAN_OUTSIDE_CALIBRATED_RANGE',
        'LOW_ORTHOGONALITY',
        'SHORT_SCALE_LINE',
      ]),
    );
  });

  it('widens the band relative to the same job estimated with a clean trace', () => {
    const clean = estimate({ ...base, buildingGeometry: GEOMETRY });
    const risky = estimate({ ...base, buildingGeometry: RISKY_GEOMETRY });
    expect(risky.confidence.sigma).toBeGreaterThan(clean.confidence.sigma);
  });

  it('adds no geometry-specific driver for a clean, well-placed trace', () => {
    const r = estimate({ ...base, buildingGeometry: GEOMETRY });
    const codes = r.confidence.drivers.map((d) => d.code);
    expect(codes).toEqual(['BASE_METHOD']);
    expect(r.confidence.level).toBe('high');
  });
});
