/** Unit conversion and display formatting. No React, no engine logic. */

export const SQFT_PER_SQM = 10.76391;

/** Tolerance for range comparisons, so exactly 578.00 and 1934.00 pass. */
export const EPS = 1e-6;

export const sqmToSqft = (v) => v * SQFT_PER_SQM;
export const sqftToSqm = (v) => v / SQFT_PER_SQM;

/** Normalise an entered area to sq.ft. `unit` is 'sqft' or 'sqm'. */
export function normalizeArea(value, unit = 'sqft') {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return unit === 'sqm' ? sqmToSqft(n) : n;
}

/** Convert a value from one unit to the other, for the Sq.Ft / Sq.Mts toggle. */
export function convertArea(value, fromUnit, toUnit) {
  const n = Number(value);
  if (!Number.isFinite(n) || fromUnit === toUnit) return value;
  return toUnit === 'sqm' ? sqftToSqm(n) : sqmToSqft(n);
}

export const kgToTonne = (kg) => kg / 1000;

export const round = (v, dp = 2) => {
  const f = 10 ** dp;
  return Math.round((v + Number.EPSILON) * f) / f;
};

export function formatNumber(v, dp = 0, locale = 'en-US') {
  if (!Number.isFinite(v)) return '—';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(v);
}

export function formatCurrency(v, { currency = 'USD', locale = 'en-US' } = {}) {
  if (!Number.isFinite(v)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}

/** "1,356.25 sq. ft." / "126.00 sq. mts." */
export function formatArea(v, unit = 'sqft', locale = 'en-US') {
  return `${formatNumber(v, 2, locale)} ${unit === 'sqm' ? 'sq. mts.' : 'sq. ft.'}`;
}

export const UNIT_LABELS = { sqft: 'Sq. Ft', sqm: 'Sq. Mts' };
