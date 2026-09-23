/** Default engine assumptions.
 *
 *  Everything a reviewer might argue with lives here, in one object, so it can be
 *  tuned without touching the engine. Rates are built up PER ELEMENT rather than
 *  down from a single kg/sq.ft figure, so the total lands inside the standard
 *  Indian residential RCC band of 3.5-4.5 kg/sq.ft on its own.
 *
 *  These are indicative thumb rules for low-rise residential RCC (M20-M25, spans
 *  under about 4.5 m, mild soil). They are NOT a structural design. */

export const ENGINE_VERSION = '1.0.0';

export const DISCLAIMER =
  'Indicative thumb-rule estimate for residential RCC (G to G+2). Not a structural design. Consult a licensed structural engineer before procurement.';

export const DEFAULT_ASSUMPTIONS = {
  version: ENGINE_VERSION,

  areaLimitsSqFt: { min: 578.0, max: 1934.0 },

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

  /** Grade changes the rate and the label, never the weight - weight is geometry. */
  gradeByElement: {
    slab: 'Fe500D',
    beam: 'Fe550D',
    column: 'Fe550D',
    footing: 'Fe500D',
    misc: 'Fe500D',
  },

  wastagePct: 0.03,
  lapPct: 0.05,

  /** Swap this whole block for another market (e.g. OMR) - nothing else changes. */
  currency: 'INR',
  locale: 'en-IN',
  currencySymbol: '₹',
  ratePerTonne: { Fe500D: 62000, Fe550D: 64000, Fe600: 67000, CRS: 68000 },
  rateLimits: { min: 10000, max: 200000 },

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

/** BIS grades Jindal Panther actually rolls, per the product spec on jindalpanther.com. */
export const GRADES = [
  { id: 'Fe500D', label: 'Fe500D', note: 'General residential - slabs, footings' },
  { id: 'Fe550D', label: 'Fe550D', note: 'Higher strength - beams, columns' },
  { id: 'Fe600', label: 'Fe600', note: 'High load; atypical for G to G+2' },
  { id: 'CRS', label: 'CRS', note: 'Corrosion resistant - coastal, saline soil' },
];

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
