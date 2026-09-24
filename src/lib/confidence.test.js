import { describe, it, expect } from 'vitest';
import { computeConfidence, bandFrom } from './confidence.js';
import { DEFAULT_ASSUMPTIONS } from '../data/assumptions.js';

const noWarnings = [];

describe('computeConfidence', () => {
  it('is high confidence for a plain villa at the calibrated height with no warnings', () => {
    const c = computeConfidence({
      levels: 3, // G+2, exactly at calibratedMaxLevels
      warnings: noWarnings,
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    expect(c.level).toBe('high');
    expect(c.drivers.map((d) => d.code)).toEqual(['BASE_METHOD']);
  });

  it('widens monotonically as storeys climb past the calibrated height', () => {
    const sigmas = [3, 4, 6, 9, 11].map(
      (levels) => computeConfidence({ levels, warnings: noWarnings, assumptions: DEFAULT_ASSUMPTIONS }).sigma,
    );
    for (let i = 1; i < sigmas.length; i++) expect(sigmas[i]).toBeGreaterThan(sigmas[i - 1]);
  });

  it('adds a distinct driver once past the lateral threshold, on top of the height driver', () => {
    const under = computeConfidence({
      levels: DEFAULT_ASSUMPTIONS.lateralThresholdLevels, // exactly at the threshold, not over
      warnings: noWarnings,
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    const over = computeConfidence({
      levels: DEFAULT_ASSUMPTIONS.lateralThresholdLevels + 2,
      warnings: noWarnings,
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    expect(under.drivers.map((d) => d.code)).not.toContain('NO_LATERAL_SYSTEM_MODELLED');
    expect(over.drivers.map((d) => d.code)).toContain('NO_LATERAL_SYSTEM_MODELLED');
    expect(over.sigma).toBeGreaterThan(under.sigma);
  });

  it('folds every relevant warning code into its own named driver', () => {
    const c = computeConfidence({
      levels: 2,
      warnings: [{ code: 'ATYPICAL_AREA' }, { code: 'PLAN_NOT_SELECTED' }, { code: 'PLAN_AREA_MISMATCH' }],
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    const codes = c.drivers.map((d) => d.code);
    expect(codes).toEqual(
      expect.arrayContaining(['ATYPICAL_AREA', 'PLAN_NOT_SELECTED', 'PLAN_AREA_MISMATCH']),
    );
  });

  it('ignores warning codes that carry no confidence weight (e.g. rounding)', () => {
    const c = computeConfidence({
      levels: 2,
      warnings: [{ code: 'AREA_ROUNDED' }],
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    expect(c.drivers.map((d) => d.code)).toEqual(['BASE_METHOD']);
  });

  it('sorts drivers with the largest contributor first', () => {
    const c = computeConfidence({
      levels: 11,
      warnings: [{ code: 'PLAN_NOT_SELECTED' }],
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    const sigmas = c.drivers.map((d) => d.sigma);
    expect(sigmas).toEqual([...sigmas].sort((a, b) => b - a));
  });

  it('combines drivers in quadrature, not by flat addition', () => {
    const c = computeConfidence({
      levels: 2,
      warnings: [{ code: 'ATYPICAL_AREA' }, { code: 'PLAN_NOT_SELECTED' }],
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    const naive = c.drivers.reduce((a, d) => a + d.sigma, 0);
    expect(c.sigma).toBeLessThan(naive);
    expect(c.sigma).toBeCloseTo(Math.sqrt(c.drivers.reduce((a, d) => a + d.sigma ** 2, 0)), 9);
  });
});

describe('bandFrom', () => {
  it('brackets the point symmetrically by sigma', () => {
    const b = bandFrom(100, 0.2);
    expect(b.low).toBeCloseTo(80, 6);
    expect(b.high).toBeCloseTo(120, 6);
  });

  it('never lets the low end go negative', () => {
    const b = bandFrom(10, 5); // sigma way over 1
    expect(b.low).toBe(0);
    expect(b.high).toBeGreaterThan(0);
  });

  it('passes NaN through rather than producing a fake band', () => {
    const b = bandFrom(NaN, 0.1);
    expect(Number.isNaN(b.low)).toBe(true);
    expect(Number.isNaN(b.high)).toBe(true);
  });
});
