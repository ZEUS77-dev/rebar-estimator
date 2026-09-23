import { describe, it, expect } from 'vitest';
import { estimate, recost, columnLevelFactors } from './estimator.js';
import { DEFAULT_ASSUMPTIONS, SCOPES } from '../data/assumptions.js';
import { FLOOR_PLANS, PLANS_BY_ID } from '../data/floorPlans.js';
import { DIAMETERS_MM, unitWeightKgPerM, kgPer12mBar } from '../data/barConstants.js';
import { SQFT_PER_SQM } from './units.js';

const plan2bhk = PLANS_BY_ID['fp-05']; // 1528.49 sq.ft, 2BHK, planFactor -> 1.00
const base = { areaSqFt: 1356.25, areaUnit: 'sqft', floors: 'G+1', plan: plan2bhk, scope: 'full' };

describe('bar constants', () => {
  it('follows d^2/162 for unit weight', () => {
    expect(unitWeightKgPerM(8)).toBeCloseTo(0.395, 3);
    expect(unitWeightKgPerM(12)).toBeCloseTo(0.889, 3);
    expect(unitWeightKgPerM(25)).toBeCloseTo(3.858, 3);
  });

  it('gives kg per 12 m bar as d^2/13.5', () => {
    for (const d of DIAMETERS_MM) {
      expect(kgPer12mBar(d)).toBeCloseTo((d * d) / 13.5, 6);
    }
  });
});

describe('assumption integrity', () => {
  it('has every diameter mix summing to 1.0', () => {
    for (const [element, mix] of Object.entries(DEFAULT_ASSUMPTIONS.diameterMix)) {
      const sum = Object.values(mix).reduce((a, b) => a + b, 0);
      expect(sum, `${element} mix`).toBeCloseTo(1, 9);
    }
  });

  it('only uses diameters the UI exposes', () => {
    for (const mix of Object.values(DEFAULT_ASSUMPTIONS.diameterMix)) {
      for (const d of Object.keys(mix)) {
        expect(DIAMETERS_MM).toContain(Number(d));
      }
    }
  });
});

describe('totals land in the residential thumb-rule band', () => {
  for (const floors of ['G', 'G+1', 'G+2']) {
    it(`${floors} is between 3.5 and 4.5 kg/sq.ft of built-up area`, () => {
      const r = estimate({ ...base, floors });
      expect(r.ok).toBe(true);
      expect(r.totals.kgPerSqFtBuiltUp).toBeGreaterThanOrEqual(3.5);
      expect(r.totals.kgPerSqFtBuiltUp).toBeLessThanOrEqual(4.5);
    });
  }
});

describe('conservation', () => {
  const r = estimate(base);

  it('sums byDiameter kg to the gross total', () => {
    const sum = r.byDiameter.reduce((a, d) => a + d.kg, 0);
    expect(Math.abs(sum - r.totals.grossKg)).toBeLessThan(0.01);
  });

  it('sums byElement gross kg to the gross total', () => {
    const sum = r.byElement.reduce((a, e) => a + e.grossKg, 0);
    expect(Math.abs(sum - r.totals.grossKg)).toBeLessThan(0.01);
  });

  it('sums byGrade kg to the gross total', () => {
    const sum = r.byGrade.reduce((a, g) => a + g.kg, 0);
    expect(Math.abs(sum - r.totals.grossKg)).toBeLessThan(0.01);
  });

  it('applies wastage and lap exactly once', () => {
    const m = (1 + DEFAULT_ASSUMPTIONS.wastagePct) * (1 + DEFAULT_ASSUMPTIONS.lapPct);
    expect(r.totals.grossKg).toBeCloseTo(r.totals.netKg * m, 6);
    expect(r.assumptionsUsed.combinedMultiplier).toBeCloseTo(1.0815, 6);
  });

  it('sums element shares to 100%', () => {
    const sum = r.byElement.reduce((a, e) => a + e.sharePct, 0);
    expect(sum).toBeCloseTo(100, 6);
  });
});

describe('floor scaling', () => {
  it('scales slab linearly with levels', () => {
    const g = estimate({ ...base, floors: 'G', scope: 'slab' });
    const g2 = estimate({ ...base, floors: 'G+2', scope: 'slab' });
    expect(g2.totals.grossKg).toBeCloseTo(g.totals.grossKg * 3, 6);
  });

  it('does NOT scale footing linearly with levels', () => {
    const g = estimate({ ...base, floors: 'G', scope: 'footing' });
    const g2 = estimate({ ...base, floors: 'G+2', scope: 'footing' });
    const ratio = g2.totals.grossKg / g.totals.grossKg;
    expect(ratio).toBeGreaterThan(1); // heavier under more load
    expect(ratio).toBeLessThan(2); // but nowhere near 3x
    expect(ratio).toBeCloseTo(1.18 / 0.8, 6);
  });

  it('sizes each column level for the storeys above it', () => {
    expect(columnLevelFactors(1, 0.15)).toEqual([1]);
    expect(columnLevelFactors(3, 0.15)).toEqual([1.3, 1.15, 1]);
  });

  it('makes single-storey heavier per sq.ft than G+2 (footing amortises)', () => {
    const g = estimate({ ...base, floors: 'G' });
    const g2 = estimate({ ...base, floors: 'G+2' });
    expect(g.totals.kgPerSqFtBuiltUp).toBeGreaterThan(g2.totals.kgPerSqFtBuiltUp);
  });
});

describe('scope', () => {
  it('gives identical footing kg whether scope is full or footing', () => {
    const full = estimate({ ...base, scope: 'full' });
    const only = estimate({ ...base, scope: 'footing' });
    const fromFull = full.byElement.find((e) => e.element === 'footing').grossKg;
    expect(only.totals.grossKg).toBeCloseTo(fromFull, 6);
  });

  it('restricts byElement to the scope definition', () => {
    for (const s of SCOPES) {
      const r = estimate({ ...base, scope: s.id });
      expect(r.byElement.map((e) => e.element)).toEqual(s.elements);
    }
  });

  it('rejects an unknown scope', () => {
    const r = estimate({ ...base, scope: 'roof' });
    expect(r.ok).toBe(false);
    expect(r.errors[0].code).toBe('UNKNOWN_SCOPE');
  });
});

describe('units and validation', () => {
  it('treats 100 sq.m the same as 1076.39 sq.ft', () => {
    const a = estimate({ ...base, areaSqFt: 100, areaUnit: 'sqm' });
    const b = estimate({ ...base, areaSqFt: 100 * SQFT_PER_SQM, areaUnit: 'sqft' });
    expect(a.totals.grossKg).toBeCloseTo(b.totals.grossKg, 6);
  });

  it('accepts the exact bounds', () => {
    expect(estimate({ ...base, areaSqFt: 578.0 }).ok).toBe(true);
    expect(estimate({ ...base, areaSqFt: 1934.0 }).ok).toBe(true);
  });

  it('rejects just outside the bounds', () => {
    expect(estimate({ ...base, areaSqFt: 577.99 }).ok).toBe(false);
    expect(estimate({ ...base, areaSqFt: 1934.01 }).ok).toBe(false);
  });

  it('rejects blank and non-numeric area', () => {
    expect(estimate({ ...base, areaSqFt: '' }).errors[0].code).toBe('REQUIRED');
    expect(estimate({ ...base, areaSqFt: 'abc' }).errors[0].code).toBe('NOT_A_NUMBER');
  });

  it('warns but does not fail when no plan is selected', () => {
    const r = estimate({ ...base, plan: null });
    expect(r.ok).toBe(true);
    expect(r.geometry.planFactor).toBe(1);
    expect(r.warnings.map((w) => w.code)).toContain('PLAN_NOT_SELECTED');
  });

  it('warns when the plan area is far from the entered area', () => {
    const r = estimate({ ...base, areaSqFt: 600, plan: PLANS_BY_ID['fp-08'] });
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.code)).toContain('PLAN_AREA_MISMATCH');
  });
});

describe('plan factor', () => {
  it('raises beam/column/misc for a 4BHK but leaves slab and footing alone', () => {
    const two = estimate({ ...base, plan: PLANS_BY_ID['fp-05'] }); // 2BHK, 1.00
    const four = estimate({ ...base, plan: PLANS_BY_ID['fp-06'] }); // 4BHK, 1.08
    const slabOf = (r) => r.byElement.find((e) => e.element === 'slab').grossKg;
    const beamOf = (r) => r.byElement.find((e) => e.element === 'beam').grossKg;
    expect(slabOf(four)).toBeCloseTo(slabOf(two), 6);
    expect(beamOf(four)).toBeCloseTo(beamOf(two) * 1.08, 6);
  });

  it('defaults every gallery plan to a sane factor', () => {
    for (const p of FLOOR_PLANS) {
      const r = estimate({ ...base, plan: p });
      expect(r.geometry.planFactor).toBeGreaterThanOrEqual(1);
      expect(r.geometry.planFactor).toBeLessThanOrEqual(1.1);
    }
  });
});

describe('bar counts', () => {
  const r = estimate(base);

  it('never emits a zero-kg diameter row', () => {
    for (const d of r.byDiameter) expect(d.kg).toBeGreaterThan(0);
  });

  it('gives at least one bar for any diameter present', () => {
    for (const d of r.byDiameter) expect(d.bars).toBeGreaterThanOrEqual(1);
  });

  it('keeps bar counts consistent with kg and 12 m length', () => {
    for (const d of r.byDiameter) {
      expect(d.bars).toBe(Math.ceil(d.kg / kgPer12mBar(d.dia)));
      expect(d.lengthM).toBeCloseTo(d.kg / unitWeightKgPerM(d.dia), 6);
    }
  });
});

describe('cost', () => {
  it('prices each grade at its own rate', () => {
    const r = estimate(base);
    const expected = r.byGrade.reduce(
      (a, g) => a + g.tonnes * DEFAULT_ASSUMPTIONS.ratePerTonne[g.grade],
      0,
    );
    expect(r.totals.costInr).toBeCloseTo(expected, 4);
  });

  it('recost changes money without touching tonnage', () => {
    const r = estimate(base);
    const re = recost(r, 70000);
    expect(re.totals.tonnes).toBe(r.totals.tonnes);
    expect(re.totals.costInr).toBeCloseTo(r.totals.tonnes * 70000, 4);
    expect(re.totals.blendedRatePerTonne).toBe(70000);
    expect(re.byDiameter).toBe(r.byDiameter);
  });

  it('recost with a blank rate yields NaN, not zero', () => {
    const re = recost(estimate(base), '');
    expect(Number.isNaN(re.totals.costInr)).toBe(true);
  });

  it('changes cost but not weight when the grade is overridden', () => {
    const a = estimate(base);
    const b = estimate({ ...base, overrides: { grade: 'Fe600' } });
    expect(b.totals.grossKg).toBeCloseTo(a.totals.grossKg, 6);
    expect(b.totals.costInr).not.toBeCloseTo(a.totals.costInr, 2);
    expect(b.warnings.map((w) => w.code)).toContain('ATYPICAL_GRADE');
  });
});

describe('spot check from the mockup', () => {
  it('1356.25 sq.ft, G+1, 2BHK, full house is about 10.5 t', () => {
    const r = estimate(base);
    expect(r.geometry.builtUpSqFt).toBeCloseTo(2712.5, 4);
    expect(r.totals.tonnes).toBeGreaterThan(10);
    expect(r.totals.tonnes).toBeLessThan(11);
  });
});
