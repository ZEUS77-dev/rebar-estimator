/** Input validation for the wizard and the engine.
 *  Errors block; warnings are advisory and never stop a calculation. */

import { DEFAULT_ASSUMPTIONS } from '../data/assumptions.js';
import { EPS, normalizeArea, sqftToSqm, formatNumber } from './units.js';

export const ERROR_CODES = {
  REQUIRED: 'REQUIRED',
  NOT_A_NUMBER: 'NOT_A_NUMBER',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  UNKNOWN_FLOORS: 'UNKNOWN_FLOORS',
  UNKNOWN_SCOPE: 'UNKNOWN_SCOPE',
};

export const WARNING_CODES = {
  PLAN_AREA_MISMATCH: 'PLAN_AREA_MISMATCH',
  PLAN_NOT_SELECTED: 'PLAN_NOT_SELECTED',
  ATYPICAL_GRADE: 'ATYPICAL_GRADE',
  MIX_NORMALISED: 'MIX_NORMALISED',
};

/** Area bounds expressed in whichever unit the field is currently showing. */
export function areaLimitsFor(unit, assumptions = DEFAULT_ASSUMPTIONS) {
  const { min, max } = assumptions.areaLimitsSqFt;
  return unit === 'sqm' ? { min: sqftToSqm(min), max: sqftToSqm(max) } : { min, max };
}

export function areaRangeHint(unit, assumptions = DEFAULT_ASSUMPTIONS) {
  const { min, max } = areaLimitsFor(unit, assumptions);
  const suffix = unit === 'sqm' ? 'sq. mts.' : 'sq. ft.';
  return `Enter area between ${formatNumber(min, 2)} ${suffix} – ${formatNumber(max, 2)} ${suffix}`;
}

/** Validate the area field alone - used live by step 1 to gate Next. */
export function validateArea(raw, unit = 'sqft', assumptions = DEFAULT_ASSUMPTIONS) {
  if (raw === '' || raw === null || raw === undefined) {
    return { code: ERROR_CODES.REQUIRED, message: 'Enter the ground floor area to continue.' };
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return { code: ERROR_CODES.NOT_A_NUMBER, message: 'Enter a valid number.' };
  }
  const sqft = normalizeArea(n, unit);
  const { min, max } = assumptions.areaLimitsSqFt;
  if (sqft < min - EPS || sqft > max + EPS) {
    const lim = areaLimitsFor(unit, assumptions);
    const suffix = unit === 'sqm' ? 'sq. mts.' : 'sq. ft.';
    return {
      code: ERROR_CODES.OUT_OF_RANGE,
      message: `Area must be between ${formatNumber(lim.min, 2)} and ${formatNumber(
        lim.max,
        2,
      )} ${suffix} (${formatNumber(min, 2)} – ${formatNumber(max, 2)} sq. ft.).`,
    };
  }
  return null;
}

/** Full engine-input check. Returns { errors, warnings }. */
export function validateInput(
  { areaSqFt, areaUnit = 'sqft', floors, scope, plan },
  assumptions = DEFAULT_ASSUMPTIONS,
) {
  const errors = [];
  const warnings = [];

  const areaError = validateArea(areaSqFt, areaUnit, assumptions);
  if (areaError) errors.push({ field: 'areaSqFt', ...areaError });

  if (floors && !['G', 'G+1', 'G+2'].includes(floors)) {
    errors.push({
      field: 'floors',
      code: ERROR_CODES.UNKNOWN_FLOORS,
      message: `Unknown floor option "${floors}".`,
    });
  }

  if (!plan) {
    warnings.push({
      code: WARNING_CODES.PLAN_NOT_SELECTED,
      message: 'No floor plan selected — layout complexity factor assumed 1.00.',
    });
  } else if (Number.isFinite(Number(areaSqFt))) {
    const entered = normalizeArea(areaSqFt, areaUnit);
    const deviation = Math.abs(plan.areaSqFt - entered) / entered;
    if (deviation > 0.25) {
      warnings.push({
        code: WARNING_CODES.PLAN_AREA_MISMATCH,
        message: `Selected plan is ${formatNumber(plan.areaSqFt, 2)} sq. ft., ${formatNumber(
          deviation * 100,
          0,
        )}% away from the ${formatNumber(entered, 2)} sq. ft. you entered. Your entered area is used for the estimate.`,
      });
    }
  }

  return { errors, warnings };
}

/** Clamp an edited rate per tonne. Returns null for blank so the UI can show "—". */
export function clampRate(raw, assumptions = DEFAULT_ASSUMPTIONS) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const { min, max } = assumptions.rateLimits;
  return Math.min(Math.max(n, min), max);
}
