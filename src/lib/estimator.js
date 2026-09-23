/** The estimation engine.
 *
 *  Pure and React-free on purpose: it imports only from ../data and ./units,
 *  so it can be lifted into a server endpoint or a widget on the live site
 *  without touching a line of it.
 *
 *  Method, in short: build kg up from five elements, each against its own
 *  reference area, then split each element by bar diameter. See
 *  ../data/assumptions.js for every number a reviewer might argue with. */

import {
  DEFAULT_ASSUMPTIONS,
  ENGINE_VERSION,
  ELEMENT_LABELS,
  FLOORS_BY_ID,
  SCOPES_BY_ID,
} from '../data/assumptions.js';
import {
  DIAMETERS_MM,
  unitWeightKgPerM,
  kgPer12mBar,
  barsFromKg,
  lengthMFromKg,
} from '../data/barConstants.js';
import { normalizeArea, kgToTonne, round } from './units.js';
import { validateInput, roundAreaSqFt, WARNING_CODES } from './validation.js';

const isDev = () => {
  try {
    return Boolean(import.meta.env && import.meta.env.DEV);
  } catch {
    return false;
  }
};

/** Column steel per level, sized for what sits above it.
 *  Ground columns of a G+2 carry two storeys -> 1 + 0.15*2 = 1.30. */
export function columnLevelFactors(levels, perStoreyAbove) {
  return Array.from({ length: levels }, (_, i) => 1 + perStoreyAbove * (levels - 1 - i));
}

/** Net kg for one element, before wastage and lap. */
export function elementKg(element, { footprintSqFt: A, levels, planFactor, assumptions }) {
  const r = assumptions.elementRatesKgPerSqFt;
  const pf = assumptions.planFactorAppliesTo.includes(element) ? planFactor : 1;

  switch (element) {
    // Poured once. It only gets heavier as the load above grows, so this is
    // deliberately sub-linear in `levels` rather than multiplied by it.
    case 'footing':
      return r.footing * (assumptions.footingStoreyFactor[levels] ?? 1) * A;
    case 'column': {
      const sum = columnLevelFactors(levels, assumptions.columnFactorPerStoreyAbove).reduce(
        (a, b) => a + b,
        0,
      );
      return r.column * A * sum * pf;
    }
    case 'beam':
      return r.beam * A * levels * pf;
    case 'slab':
      return r.slab * A * levels * pf;
    case 'misc':
      return r.misc * A * levels * pf;
    default:
      return 0;
  }
}

/** Split kg across diameters. Auto-normalises a mix that does not sum to 1
 *  rather than silently losing steel. */
export function splitByDiameter(kg, mix, { element, warnings } = {}) {
  const sum = Object.values(mix).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-9) {
    if (isDev()) {
      console.warn(`[estimator] diameterMix for "${element}" sums to ${sum}, normalising.`);
    }
    if (warnings) {
      warnings.push({
        code: WARNING_CODES.MIX_NORMALISED,
        message: `Diameter mix for ${element} summed to ${round(sum, 4)} and was normalised.`,
      });
    }
  }
  const out = {};
  for (const [d, frac] of Object.entries(mix)) out[Number(d)] = (kg * frac) / sum;
  return out;
}

/** Push rounding residue into the largest diameter so the parts always add up
 *  to the whole on screen. */
function reconcile(byDia, target) {
  const dias = Object.keys(byDia)
    .map(Number)
    .filter((d) => byDia[d] > 0);
  if (!dias.length) return byDia;
  const sum = dias.reduce((a, d) => a + byDia[d], 0);
  const largest = Math.max(...dias);
  byDia[largest] += target - sum;
  return byDia;
}

/**
 * @param {object} input
 * @param {number|string} input.areaSqFt  value as typed (in `areaUnit`)
 * @param {'sqft'|'sqm'} [input.areaUnit]
 * @param {'G'|'G+1'|'G+2'} [input.floors]
 * @param {object|null} [input.plan]      a FLOOR_PLANS entry
 * @param {string} [input.scope]          a SCOPES id
 * @param {object} [input.assumptions]
 * @param {object} [input.overrides]      { ratePerTonne, grade, wastagePct, lapPct }
 */
export function estimate({
  areaSqFt,
  areaUnit = 'sqft',
  floors = 'G',
  plan = null,
  scope = 'full',
  assumptions = DEFAULT_ASSUMPTIONS,
  overrides = {},
} = {}) {
  const { errors, warnings } = validateInput({ areaSqFt, areaUnit, floors, plan }, assumptions);
  if (errors.length) return { ok: false, errors, warnings };

  const scopeDef = SCOPES_BY_ID[scope];
  if (!scopeDef) {
    return {
      ok: false,
      errors: [{ field: 'scope', code: 'UNKNOWN_SCOPE', message: `Unknown scope "${scope}".` }],
      warnings,
    };
  }

  // Rounded, per assumptions.areaRoundingSqFt — validateInput already warned if it moved.
  const A = roundAreaSqFt(normalizeArea(areaSqFt, areaUnit), assumptions);
  const levels = FLOORS_BY_ID[floors].levels;
  const builtUpSqFt = A * levels;
  const planFactor =
    plan && plan.planFactor != null
      ? plan.planFactor
      : plan
        ? assumptions.planFactorByBhk[plan.bhk] ?? 1
        : 1;

  const wastagePct = overrides.wastagePct != null ? overrides.wastagePct : assumptions.wastagePct;
  const lapPct = overrides.lapPct != null ? overrides.lapPct : assumptions.lapPct;
  const multiplier = (1 + wastagePct) * (1 + lapPct);

  const rates = { ...assumptions.ratePerTonne, ...(overrides.ratePerTonne || {}) };
  const gradeFor = (el) => overrides.grade || assumptions.gradeByElement[el];

  if (overrides.grade === 'A1035') {
    warnings.push({
      code: WARNING_CODES.ATYPICAL_GRADE,
      message:
        'A1035 is a corrosion-resistant alloy specified for coastal or saline ground. Weight is unchanged — only the rate and the label differ.',
    });
  }

  // --- per element -------------------------------------------------------
  const byElement = scopeDef.elements.map((el) => {
    const netKg = elementKg(el, { footprintSqFt: A, levels, planFactor, assumptions });
    const grossKg = netKg * multiplier;
    const grade = gradeFor(el);
    const ratePerTonne = rates[grade];
    const byDiameter = reconcile(
      splitByDiameter(grossKg, assumptions.diameterMix[el], { element: el, warnings }),
      grossKg,
    );
    return {
      element: el,
      label: ELEMENT_LABELS[el],
      grade,
      netKg,
      grossKg,
      tonnes: kgToTonne(grossKg),
      ratePerTonne,
      cost: kgToTonne(grossKg) * ratePerTonne,
      byDiameter,
    };
  });

  const netKg = byElement.reduce((a, e) => a + e.netKg, 0);
  const grossKg = byElement.reduce((a, e) => a + e.grossKg, 0);
  for (const e of byElement) e.sharePct = grossKg ? (e.grossKg / grossKg) * 100 : 0;

  // --- roll up by diameter ----------------------------------------------
  // Aggregate kg across all elements FIRST, then ceil to whole bars. Ceiling
  // per element and summing those would over-count bars badly.
  const diaKg = {};
  for (const e of byElement) {
    for (const [d, kg] of Object.entries(e.byDiameter)) {
      diaKg[Number(d)] = (diaKg[Number(d)] || 0) + kg;
    }
  }
  reconcile(diaKg, grossKg);

  const byDiameter = DIAMETERS_MM.filter((d) => (diaKg[d] || 0) > 0.0005).map((d) => {
    const kg = diaKg[d];
    return {
      dia: d,
      unitWeightKgPerM: unitWeightKgPerM(d),
      kgPer12mBar: kgPer12mBar(d),
      kg,
      tonnes: kgToTonne(kg),
      bars: barsFromKg(kg, d),
      lengthM: lengthMFromKg(kg, d),
      sharePct: grossKg ? (kg / grossKg) * 100 : 0,
      byElement: Object.fromEntries(
        byElement.map((e) => [e.element, e.byDiameter[d] || 0]).filter(([, v]) => v > 0),
      ),
    };
  });

  // --- roll up by grade --------------------------------------------------
  const gradeMap = {};
  for (const e of byElement) {
    if (!gradeMap[e.grade]) {
      gradeMap[e.grade] = { grade: e.grade, kg: 0, ratePerTonne: e.ratePerTonne, elements: [] };
    }
    gradeMap[e.grade].kg += e.grossKg;
    gradeMap[e.grade].elements.push(e.element);
  }
  const byGrade = Object.values(gradeMap).map((g) => ({
    ...g,
    tonnes: kgToTonne(g.kg),
    cost: kgToTonne(g.kg) * g.ratePerTonne,
  }));

  const tonnes = kgToTonne(grossKg);
  const cost = byGrade.reduce((a, g) => a + g.cost, 0);

  return {
    ok: true,
    warnings,
    input: {
      areaSqFt: A,
      areaEntered: Number(areaSqFt),
      areaUnit,
      floors,
      levels,
      planId: plan ? plan.id : null,
      planType: plan ? plan.type : null,
      scope,
      assumptionsVersion: assumptions.version,
    },
    geometry: { footprintSqFt: A, builtUpSqFt, levels, planFactor },
    totals: {
      netKg,
      grossKg,
      tonnes,
      kgPerSqFtBuiltUp: builtUpSqFt ? grossKg / builtUpSqFt : 0,
      cost,
      blendedRatePerTonne: tonnes ? cost / tonnes : 0,
    },
    byElement,
    byDiameter,
    byGrade,
    assumptionsUsed: {
      elementRatesKgPerSqFt: assumptions.elementRatesKgPerSqFt,
      footingStoreyFactorApplied: assumptions.footingStoreyFactor[levels],
      columnLevelFactors: columnLevelFactors(levels, assumptions.columnFactorPerStoreyAbove),
      planFactor,
      wastagePct,
      lapPct,
      combinedMultiplier: multiplier,
      diameterMix: assumptions.diameterMix,
      ratePerTonne: rates,
      currency: assumptions.currency,
      locale: assumptions.locale,
      disclaimer: assumptions.disclaimer,
    },
    meta: { generatedAt: new Date().toISOString(), engineVersion: ENGINE_VERSION },
  };
}

/** Re-price an existing result at a new flat rate per tonne.
 *  Deliberately cheap: a keystroke in the rate field must not re-run estimate(). */
export function recost(result, ratePerTonne) {
  if (!result || !result.ok) return result;
  // Number('') is 0, which would quietly price the whole estimate at zero.
  const blank = ratePerTonne === '' || ratePerTonne === null || ratePerTonne === undefined;
  const rate = blank ? NaN : Number(ratePerTonne);
  if (!Number.isFinite(rate)) {
    return { ...result, totals: { ...result.totals, cost: NaN, blendedRatePerTonne: NaN } };
  }
  return {
    ...result,
    byElement: result.byElement.map((e) => ({ ...e, ratePerTonne: rate, cost: e.tonnes * rate })),
    byGrade: result.byGrade.map((g) => ({ ...g, ratePerTonne: rate, cost: g.tonnes * rate })),
    totals: {
      ...result.totals,
      cost: result.totals.tonnes * rate,
      blendedRatePerTonne: rate,
    },
  };
}
