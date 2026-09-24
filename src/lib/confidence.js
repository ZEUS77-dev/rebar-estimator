/** How much to trust a given estimate — additive, explainable, and honest about
 *  what this engine does not model.
 *
 *  The point figure `estimate()` returns is always a single thumb-rule number,
 *  computed the same way whether the job is a G+1 villa or a traced G+10 tower.
 *  That number deserves very different amounts of trust in those two cases, and
 *  a calculator that shows the same false precision either way is misleading by
 *  omission. This module turns "how far past what we actually calibrated is
 *  this?" into a widening range plus a list of NAMED reasons, so a reviewer can
 *  see exactly which knob pushed the number, rather than a bare "±20%".
 *
 *  Each contributing factor is an independent source of uncertainty, so they
 *  combine in quadrature (root-sum-of-squares) rather than by simple addition —
 *  that is the standard way to combine independent error sources, and it means
 *  five small drivers don't pile up as dramatically as one big one. */

/** Always present: this is a thumb-rule engine, not a structural design, even
 *  in the best case. */
const BASE_SIGMA = 0.12;

/** Each additional level past the storey count the 3.5-4.5 kg/sq.ft band was
 *  actually validated against (assumptions.calibratedMaxLevels) is one more
 *  step of straight-line extrapolation. */
const SIGMA_PER_LEVEL_OVER_CALIBRATED = 0.04;

/** Past assumptions.lateralThresholdLevels the gap is not just quantitative
 *  extrapolation — it's a missing structural SYSTEM (shear walls / a core),
 *  which is a qualitatively different kind of unknown, so it is its own driver
 *  on top of the calibration-distance one above. */
const SIGMA_PER_LEVEL_OVER_LATERAL = 0.05;

const SIGMA_ATYPICAL_AREA = 0.06;
const SIGMA_PLAN_NOT_SELECTED = 0.03;
const SIGMA_PLAN_AREA_MISMATCH = 0.04;

const LEVEL_THRESHOLDS = { high: 0.15, moderate: 0.3 };

function levelFor(sigma) {
  if (sigma <= LEVEL_THRESHOLDS.high) return 'high';
  if (sigma <= LEVEL_THRESHOLDS.moderate) return 'moderate';
  return 'low';
}

/**
 * @param {object} input
 * @param {number} input.levels
 * @param {Array<{code:string}>} input.warnings   the warnings estimate() already produced
 * @param {object} input.assumptions
 * @param {'area'|'geometry'} [input.basis]        what the point figure was built from
 */
export function computeConfidence({ levels, warnings, assumptions, basis = 'area' }) {
  const drivers = [
    {
      code: 'BASE_METHOD',
      sigma: BASE_SIGMA,
      label: 'Thumb-rule method',
      hint: 'Every figure from this tool is an indicative estimate, not a structural design.',
    },
  ];

  const overCalibrated = Math.max(0, levels - assumptions.calibratedMaxLevels);
  if (overCalibrated > 0) {
    drivers.push({
      code: 'BEYOND_CALIBRATED_HEIGHT',
      sigma: overCalibrated * SIGMA_PER_LEVEL_OVER_CALIBRATED,
      label: `${overCalibrated} storey${overCalibrated === 1 ? '' : 's'} past the calibrated range`,
      hint: 'The 3.5–4.5 kg/sq.ft band was validated up to G+2. Taller than that is an extrapolation of the same curve, not a new measurement.',
    });
  }

  const overLateral = Math.max(0, levels - assumptions.lateralThresholdLevels);
  if (overLateral > 0) {
    drivers.push({
      code: 'NO_LATERAL_SYSTEM_MODELLED',
      sigma: overLateral * SIGMA_PER_LEVEL_OVER_LATERAL,
      label: 'No shear walls or core in this model',
      hint: 'At this height a real building would likely need a lateral system this engine does not represent. Treat the figure as a starting range for a structural engineer, not a quantity to order against.',
    });
  }

  const codes = new Set(warnings.map((w) => w.code));
  if (codes.has('ATYPICAL_AREA')) {
    drivers.push({
      code: 'ATYPICAL_AREA',
      sigma: SIGMA_ATYPICAL_AREA,
      label: 'Area outside the recommended band',
      hint: 'Unusually small or large floor plates behave less predictably under a flat per-element rate.',
    });
  }
  if (codes.has('PLAN_NOT_SELECTED')) {
    drivers.push({
      code: 'PLAN_NOT_SELECTED',
      sigma: SIGMA_PLAN_NOT_SELECTED,
      label: 'No floor plan selected',
      hint: 'Picking a similar plan — or tracing your own — replaces a guessed layout factor with a measured one.',
      actionable: true,
    });
  }
  if (codes.has('PLAN_AREA_MISMATCH')) {
    drivers.push({
      code: 'PLAN_AREA_MISMATCH',
      sigma: SIGMA_PLAN_AREA_MISMATCH,
      label: 'Selected plan area differs from the entered area',
      hint: 'Pick a plan closer to the area you entered, or trace your own, for a tighter estimate.',
      actionable: true,
    });
  }

  const sigma = Math.sqrt(drivers.reduce((sum, d) => sum + d.sigma * d.sigma, 0));

  return {
    basis,
    sigma,
    level: levelFor(sigma),
    drivers: drivers.filter((d) => d.sigma > 0).sort((a, b) => b.sigma - a.sigma),
  };
}

/** Turns a point figure and a sigma into a legible ± range. Not a statistical
 *  confidence interval in the rigorous sense — sigma here is a hand-built
 *  heuristic, not a fitted distribution — so this is presented as "a range",
 *  never as a percentage-confidence claim. */
export function bandFrom(point, sigma) {
  if (!Number.isFinite(point)) return { low: NaN, high: NaN };
  return {
    low: Math.max(0, point * (1 - sigma)),
    high: point * (1 + sigma),
  };
}
