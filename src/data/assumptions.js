/** Default engine assumptions.
 *
 *  Everything a reviewer might argue with lives here, in one object, so it can be
 *  tuned without touching the engine. Rates are built up PER ELEMENT rather than
 *  down from a single kg/sq.ft figure, so the total lands inside the standard
 *  residential RCC band of 3.5-4.5 kg/sq.ft on its own.
 *
 *  These are indicative thumb rules for RCC framed construction (spans under
 *  about 4.5 m, mild soil, no basements). They are NOT a structural design.
 *  The 3.5-4.5 kg/sq.ft band itself was only ever validated up to G+2
 *  (`calibratedMaxLevels`) - everything taller is an honest extrapolation, and
 *  `src/lib/confidence.js` is what keeps that honesty visible on the result
 *  screen rather than presenting a false-precision point figure. */

export const ENGINE_VERSION = '1.2.0';

export const DISCLAIMER =
  'Indicative thumb-rule estimate for RCC framed construction. Not a structural design. Consult a licensed structural engineer before procurement. Above a low-rise villa, treat the figure as a range, not a quote.';

/** Footing steel scales sub-linearly with storey count: it is poured once, and
 *  only gets heavier as the load above it grows, with diminishing returns per
 *  additional storey. This extends the original 3-point table (1:0.8, 2:1.0,
 *  3:1.18) with the same decay those points already implied, rather than
 *  inventing a new shape once floors go past G+2:
 *
 *    delta(2) = 0.20, delta(3) = 0.18  ->  decay = 0.18/0.20 = 0.9
 *    asymptote = f(1) + delta(2) / (1 - decay) = 0.8 + 0.20/0.1 = 2.8
 *
 *  f(n) = asymptote - (asymptote - f(1)) * decay^(n-1)
 *
 *  f(1)=0.800, f(2)=1.000, f(3)=1.180 (all exact matches to the original table),
 *  f(4)=1.342, f(6)=1.619, f(9)=1.939, f(11)=2.103. A footing keeps getting
 *  heavier indefinitely under this curve, which is the honest shape - in
 *  reality, past roughly G+4/G+5 an isolated footing usually gives way to a
 *  combined footing, then a raft, then piles, none of which this model knows
 *  about. That is exactly the kind of thing `confidence.js` should be flagging
 *  once storeys climb, not something to silently paper over with a bigger
 *  factor. */
const FOOTING_BASE = 0.8;
const FOOTING_ASYMPTOTE = 2.8;
const FOOTING_DECAY = 0.9;

export function footingStoreyFactor(levels) {
  return FOOTING_ASYMPTOTE - (FOOTING_ASYMPTOTE - FOOTING_BASE) * FOOTING_DECAY ** (levels - 1);
}

/** Column steel above `lateralThresholdLevels` gets a growing surcharge, standing
 *  in for the shear walls / core a real lateral system would need - this engine
 *  models neither. It is a thumb-rule nudge, not a lateral analysis: treat any
 *  estimate that triggers it as a range, which is why it also drives a
 *  confidence penalty (see confidence.js) rather than just changing the number
 *  quietly. */
export function lateralSurchargeFactor(levels, assumptions) {
  const over = Math.max(0, levels - assumptions.lateralThresholdLevels);
  return 1 + over * assumptions.lateralSurchargePerLevelAboveThreshold;
}

export const DEFAULT_ASSUMPTIONS = {
  version: ENGINE_VERSION,

  /** Recommended, NOT enforced. Shown on step 1 as guidance and used as the
   *  threshold for an advisory warning; any positive area is still accepted.
   *  Brackets a typical villa ground-floor plate. Overridden per building type -
   *  see BUILDING_TYPES and withBuildingType() below. */
  recommendedAreaSqFt: { min: 500, max: 3000 },

  /** The entered footprint is rounded to the nearest whole sq.ft before use.
   *  A hand-measured plot does not carry three decimal places of meaning. */
  areaRoundingSqFt: 1,

  /** kg of steel per sq.ft of the element's reference area. */
  elementRatesKgPerSqFt: {
    footing: 0.75, // ground footprint, poured once
    column: 0.8, // ground footprint, per storey level
    beam: 1.05, // slab area, per floor
    slab: 1.1, // slab area, per floor
    misc: 0.2, // staircase, lintel, chajja, parapet - slab area, per floor
  },

  /** A footing is poured once; it only gets heavier as the load above grows.
   *  A function now rather than a 3-entry lookup - see footingStoreyFactor()
   *  above for the derivation. */
  footingStoreyFactor,

  /** Each level's columns carry what sits above them, so they are sized up by
   *  this much per storey above. Ground columns of a G+2 -> 1 + 0.15*2 = 1.30. */
  columnFactorPerStoreyAbove: 0.15,

  /** Above this many levels, a real lateral system (shear walls, a core) would
   *  normally take over from the frame - this engine models none, so column
   *  steel gets a growing surcharge instead of a proper lateral analysis, and
   *  confidence degrades faster past this point too. */
  lateralThresholdLevels: 8,
  lateralSurchargePerLevelAboveThreshold: 0.08,

  /** The storey count the 3.5-4.5 kg/sq.ft band was actually validated against.
   *  Confidence degrades progressively above this - the model is a straight-
   *  line extrapolation past G+2 even before the lateral surcharge above ever
   *  switches on. */
  calibratedMaxLevels: 3,

  /** A more cut-up layout means more beams and columns per sq.ft. */
  planFactorByBhk: { 2: 1.0, 3: 1.04, 4: 1.08 },
  planFactorAppliesTo: ['beam', 'column', 'misc'],

  /** Share of each element's steel by bar diameter (mm). Each row sums to 1.0.
   *  The 8 mm share in beam/column is stirrups and lateral ties. Column carries
   *  32 mm too - standard for taller-building columns, negligible weight below
   *  the lateral threshold since the mix is otherwise unchanged. */
  diameterMix: {
    slab: { 8: 0.55, 10: 0.35, 12: 0.1 },
    beam: { 8: 0.1, 12: 0.3, 16: 0.45, 20: 0.15 },
    column: { 8: 0.1, 12: 0.15, 16: 0.4, 20: 0.2, 25: 0.1, 32: 0.05 },
    footing: { 10: 0.3, 12: 0.45, 16: 0.25 },
    misc: { 8: 0.5, 10: 0.3, 12: 0.2 },
  },

  /** Grade changes the rate and the label, never the weight - weight is geometry.
   *  A615 Gr-60 is the residential workhorse, so it is the default throughout;
   *  the grade selector switches the whole job. */
  gradeByElement: {
    slab: 'A615-60',
    beam: 'A615-60',
    column: 'A615-60',
    footing: 'A615-60',
    misc: 'A615-60',
  },

  wastagePct: 0.03,
  lapPct: 0.05,

  /** Swap this whole block for another market - nothing else changes. */
  currency: 'USD',
  locale: 'en-US',
  currencySymbol: '$',

  /** PLACEHOLDER RATES — indicative USD per tonne, NOT quoted prices.
   *  Replace with Jindal Steel Oman's actual commercial rates before this is
   *  shown to anyone outside the review. */
  ratePerTonne: {
    B500B: 620,
    'A615-40': 595,
    'A615-60': 620,
    'A615-75': 645,
    'A706-60': 680,
    'A706-80': 705,
    A1035: 1250,
    'AIR-COOLED': 580,
  },
  ratesArePlaceholder: true,
  rateLimits: { min: 200, max: 3000 },

  disclaimer: DISCLAIMER,
};

export const ELEMENTS = [
  { id: 'footing', label: 'Footing', blurb: 'Isolated footings and plinth beams' },
  { id: 'column', label: 'Column', blurb: 'Vertical members, all levels' },
  { id: 'beam', label: 'Beam', blurb: 'Floor and plinth beams' },
  { id: 'slab', label: 'Slab', blurb: 'Floor and roof slabs' },
  { id: 'misc', label: 'Staircase & misc', blurb: 'Staircase, lintels, chajja, parapet' },
];

export const ELEMENT_LABELS = Object.fromEntries(ELEMENTS.map((e) => [e.id, e.label]));

/** The Jindal Steel Oman rebar range. */
export const GRADES = [
  { id: 'B500B', label: 'B500B', standard: 'BS 4449', note: 'General purpose — the common GCC specification' },
  { id: 'A615-40', label: 'A615 Gr-40', standard: 'ASTM A615', note: 'Lower strength — light structures' },
  { id: 'A615-60', label: 'A615 Gr-60', standard: 'ASTM A615', note: 'Standard residential workhorse' },
  { id: 'A615-75', label: 'A615 Gr-75', standard: 'ASTM A615', note: 'Higher strength — heavier loads' },
  { id: 'A706-60', label: 'A706 Gr-60', standard: 'ASTM A706', note: 'Earthquake resistant — weldable, ductile' },
  { id: 'A706-80', label: 'A706 Gr-80', standard: 'ASTM A706', note: 'Earthquake resistant — high strength' },
  { id: 'A1035', label: 'A1035', standard: 'ASTM A1035', note: 'Corrosion resistant — coastal and saline ground' },
  { id: 'AIR-COOLED', label: 'Air-cooled', standard: '—', note: 'Air-cooled rebar' },
];

export const GRADES_BY_ID = Object.fromEntries(GRADES.map((g) => [g.id, g]));

export const SCOPES = [
  {
    id: 'full',
    label: 'Full House',
    blurb: 'Footings, columns, beams, slabs and staircase',
    elements: ['footing', 'column', 'beam', 'slab', 'misc'],
  },
  { id: 'slab', label: 'Slab', blurb: 'Floor and roof slabs only', elements: ['slab'] },
  { id: 'beam', label: 'Beam', blurb: 'Floor and plinth beams only', elements: ['beam'] },
  { id: 'column', label: 'Column', blurb: 'Columns only, all levels', elements: ['column'] },
  { id: 'footing', label: 'Footing', blurb: 'Footings and plinth only', elements: ['footing'] },
];

/** G through G+2 kept exactly as written - some tests and copy pin these labels
 *  verbatim. G+3..G+10 are generated so eleven entries never need hand-typing
 *  (and never drift out of sync with each other) - see footingStoreyFactor()
 *  and lateralSurchargeFactor() above for what actually changes as this list
 *  gets taller. */
export const FLOOR_OPTIONS = [
  { id: 'G', label: 'Ground', levels: 1, blurb: 'Single storey' },
  { id: 'G+1', label: 'G+1', levels: 2, blurb: 'Ground + 1 floor' },
  { id: 'G+2', label: 'G+2', levels: 3, blurb: 'Ground + 2 floors' },
  ...Array.from({ length: 8 }, (_, i) => {
    const n = i + 3; // G+3 .. G+10
    return { id: `G+${n}`, label: `G+${n}`, levels: n + 1, blurb: `Ground + ${n} floors` };
  }),
];

export const FLOORS_BY_ID = Object.fromEntries(FLOOR_OPTIONS.map((f) => [f.id, f]));
export const SCOPES_BY_ID = Object.fromEntries(SCOPES.map((s) => [s.id, s]));

/** Two presets, not two engines: choosing "Apartment" only widens the
 *  recommended area band and the levels the tool considers typical for that
 *  band - the maths underneath is identical. Recommended, never enforced,
 *  same philosophy as the area band itself: picking Villa and then typing
 *  G+6 still calculates, it just earns a lower-confidence range. */
export const BUILDING_TYPES = {
  villa: {
    id: 'villa',
    label: 'Villa / house',
    blurb: 'A single home - the range this tool was originally calibrated against',
    recommendedAreaSqFt: { min: 500, max: 3000 },
    recommendedMaxLevels: 3, // G+2
  },
  apartment: {
    id: 'apartment',
    label: 'Apartment block',
    blurb: 'A multi-unit residential building',
    recommendedAreaSqFt: { min: 3000, max: 40000 },
    recommendedMaxLevels: 11, // G+10, the top of today's range
  },
};

export const BUILDING_TYPES_LIST = Object.values(BUILDING_TYPES);
export const DEFAULT_BUILDING_TYPE = 'villa';

/** Applies a building-type preset on top of the base assumptions. Only touches
 *  the fields the preset actually varies (today: the recommended area band) -
 *  everything else, including every rate and factor above, is shared by both
 *  presets, because it is the same engine either way. */
export function withBuildingType(assumptions, buildingTypeId) {
  const type = BUILDING_TYPES[buildingTypeId] ?? BUILDING_TYPES[DEFAULT_BUILDING_TYPE];
  return {
    ...assumptions,
    recommendedAreaSqFt: type.recommendedAreaSqFt,
    recommendedMaxLevels: type.recommendedMaxLevels,
    buildingType: type.id,
  };
}
