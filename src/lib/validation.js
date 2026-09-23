/** Input validation for the wizard and the engine.
 *  Errors block; warnings are advisory and never stop a calculation.
 *
 *  There is deliberately no fixed area range. Step 1 shows a recommended band as
 *  guidance, but any positive area is accepted and rounded; one outside the band
 *  earns a note on entry and a warning on the result screen, never a block. */

import { DEFAULT_ASSUMPTIONS } from '../data/assumptions.js';
import { normalizeArea, sqftToSqm, formatNumber } from './units.js';

export const ERROR_CODES = {
  REQUIRED: 'REQUIRED',
  NOT_A_NUMBER: 'NOT_A_NUMBER',
  NOT_POSITIVE: 'NOT_POSITIVE',
  UNKNOWN_FLOORS: 'UNKNOWN_FLOORS',
  UNKNOWN_SCOPE: 'UNKNOWN_SCOPE',
};

export const WARNING_CODES = {
  PLAN_AREA_MISMATCH: 'PLAN_AREA_MISMATCH',
  PLAN_NOT_SELECTED: 'PLAN_NOT_SELECTED',
  ATYPICAL_AREA: 'ATYPICAL_AREA',
  ATYPICAL_GRADE: 'ATYPICAL_GRADE',
  MIX_NORMALISED: 'MIX_NORMALISED',
  AREA_ROUNDED: 'AREA_ROUNDED',
};

/** Round the footprint to the nearest whole sq.ft. A hand-measured plot does not
 *  carry three decimal places of meaning, and the estimate is a thumb rule. */
export function roundAreaSqFt(sqft, assumptions = DEFAULT_ASSUMPTIONS) {
  const step = assumptions.areaRoundingSqFt || 1;
  return Math.round(sqft / step) * step;
}

/** The recommended band expressed in whichever unit the field is showing. */
export function recommendedAreaFor(unit, assumptions = DEFAULT_ASSUMPTIONS) {
  const { min, max } = assumptions.recommendedAreaSqFt;
  return unit === 'sqm' ? { min: sqftToSqm(min), max: sqftToSqm(max) } : { min, max };
}

/** Guidance for step 1. Deliberately worded as a recommendation, not a limit -
 *  anything positive is accepted. */
export function areaRangeHint(unit = 'sqft', assumptions = DEFAULT_ASSUMPTIONS) {
  const { min, max } = recommendedAreaFor(unit, assumptions);
  const suffix = unit === 'sqm' ? 'sq. mts.' : 'sq. ft.';
  return `Recommended ${formatNumber(min, 0)} – ${formatNumber(
    max,
    0,
  )} ${suffix} for a home. Other sizes are accepted.`;
}

/** Non-blocking: true when the entered area sits outside the recommended band,
 *  so step 1 can show a gentle note beside the field. */
export function isOutsideRecommended(raw, unit = 'sqft', assumptions = DEFAULT_ASSUMPTIONS) {
  const n = Number(raw);
  if (raw === '' || !Number.isFinite(n) || n <= 0) return false;
  const sqft = normalizeArea(n, unit);
  const { min, max } = assumptions.recommendedAreaSqFt;
  return sqft < min || sqft > max;
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
  if (n <= 0) {
    return { code: ERROR_CODES.NOT_POSITIVE, message: 'Area must be greater than zero.' };
  }
  // Rounding means anything under half a sq.ft would collapse to zero.
  if (normalizeArea(n, unit) < 0.5) {
    return { code: ERROR_CODES.NOT_POSITIVE, message: 'That area is too small to estimate.' };
  }
  return null;
}

/** Full engine-input check. Returns { errors, warnings }. */
export function validateInput(
  { areaSqFt, areaUnit = 'sqft', floors, plan },
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

  if (errors.length) return { errors, warnings };

  const entered = normalizeArea(areaSqFt, areaUnit);
  const rounded = roundAreaSqFt(entered, assumptions);

  if (Math.abs(rounded - entered) > 1e-9) {
    warnings.push({
      code: WARNING_CODES.AREA_ROUNDED,
      message: `Area rounded from ${formatNumber(entered, 2)} to ${formatNumber(
        rounded,
        0,
      )} sq. ft. for the estimate.`,
    });
  }

  const { min, max } = assumptions.recommendedAreaSqFt;
  if (rounded < min || rounded > max) {
    warnings.push({
      code: WARNING_CODES.ATYPICAL_AREA,
      message: `${formatNumber(
        rounded,
        0,
      )} sq. ft. is outside the recommended ${formatNumber(min, 0)}–${formatNumber(
        max,
        0,
      )} sq. ft. for a home. The thumb rules behind this estimate are calibrated for low-rise housing, so treat the result with extra caution.`,
    });
  }

  if (!plan) {
    warnings.push({
      code: WARNING_CODES.PLAN_NOT_SELECTED,
      message: 'No floor plan selected — layout complexity factor assumed 1.00.',
    });
  } else {
    const deviation = Math.abs(plan.areaSqFt - rounded) / rounded;
    if (deviation > 0.25) {
      warnings.push({
        code: WARNING_CODES.PLAN_AREA_MISMATCH,
        message: `Selected plan is ${formatNumber(plan.areaSqFt, 2)} sq. ft., ${formatNumber(
          deviation * 100,
          0,
        )}% away from the ${formatNumber(
          rounded,
          0,
        )} sq. ft. you entered. Your entered area is used for the estimate.`,
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
