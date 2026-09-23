/** Default engine assumptions.
 *
 *  Everything a reviewer might argue with lives here, in one object, so it can be
 *  tuned without touching the engine. Rates are built up PER ELEMENT rather than
 *  down from a single kg/sq.ft figure, so the total lands inside the standard
 *  residential RCC band of 3.5-4.5 kg/sq.ft on its own.
 *
 *  These are indicative thumb rules for low-rise residential RCC (spans under
 *  about 4.5 m, mild soil). They are NOT a structural design. */

export const ENGINE_VERSION = '1.1.0';

export const DISCLAIMER =
  'Indicative thumb-rule estimate for residential RCC (G to G+2). Not a structural design. Consult a licensed structural engineer before procurement.';

export const DEFAULT_ASSUMPTIONS = {
  version: ENGINE_VERSION,

  /** Recommended, NOT enforced. Shown on step 1 as guidance and used as the
   *  threshold for an advisory warning; any positive area is still accepted.
   *  Brackets a typical villa ground-floor plate. */
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

  /** A footing is poured once; it only gets heavier as the load above grows. */
  footingStoreyFactor: { 1: 0.8, 2: 1.0, 3: 1.18 },

  /** Each level's columns carry what sits above them, so they are sized up by
   *  this much per storey above. Ground columns of a G+2 -> 1 + 0.15*2 = 1.30. */
  columnFactorPerStoreyAbove: 0.15,

  /** A more cut-up layout means more beams and columns per sq.ft. */
  planFactorByBhk: { 2: 1.0, 3: 1.04, 4: 1.08 },
  planFactorAppliesTo: ['beam', 'column', 'misc'],

  /** Share of each element's steel by bar diameter (mm). Each row sums to 1.0.
   *  The 8 mm share in beam/column is stirrups and lateral ties. */
  diameterMix: {
    slab: { 8: 0.55, 10: 0.35, 12: 0.1 },
    beam: { 8: 0.1, 12: 0.3, 16: 0.45, 20: 0.15 },
    column: { 8: 0.1, 12: 0.15, 16: 0.45, 20: 0.25, 25: 0.05 },
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

export const FLOOR_OPTIONS = [
  { id: 'G', label: 'Ground', levels: 1, blurb: 'Single storey' },
  { id: 'G+1', label: 'G+1', levels: 2, blurb: 'Ground + 1 floor' },
  { id: 'G+2', label: 'G+2', levels: 3, blurb: 'Ground + 2 floors' },
];

export const FLOORS_BY_ID = Object.fromEntries(FLOOR_OPTIONS.map((f) => [f.id, f]));
export const SCOPES_BY_ID = Object.fromEntries(SCOPES.map((s) => [s.id, s]));
