/** Floor plan gallery for step 3.
 *
 *  No plan images shipped with the brief, so each plan carries its own room
 *  rectangles on a 0-100 grid and <FloorPlanSvg> draws it. Areas for the first
 *  five come straight from the mockups; the 4BHK set was added so the 4BHK
 *  filter chip is not empty.
 *
 *  planFactor is layout complexity, not area - a more cut-up plan needs more
 *  beams and columns per sq.ft. Defaults to planFactorByBhk when omitted. */

export const FLOOR_PLANS = [
  {
    id: 'fp-01',
    name: 'Plan A',
    areaSqFt: 1227.1,
    bhk: 3,
    type: '3BHK',
    bedrooms: 3,
    bathrooms: 2,
    rooms: [
      { label: 'BEDROOM', dim: "12'0\" x 11'0\"", x: 2, y: 2, w: 40, h: 38 },
      { label: 'LIVING / DINING', dim: "16'0\" x 13'6\"", x: 44, y: 2, w: 54, h: 46 },
      { label: 'BEDROOM', dim: "11'0\" x 10'6\"", x: 2, y: 42, w: 40, h: 34 },
      { label: 'KITCHEN', dim: "10'0\" x 8'0\"", x: 44, y: 50, w: 30, h: 26 },
      { label: 'TOILET', x: 76, y: 50, w: 22, h: 26 },
      { label: 'BEDROOM', dim: "10'6\" x 10'0\"", x: 2, y: 78, w: 44, h: 20 },
      { label: 'BALCONY', x: 48, y: 78, w: 50, h: 20 },
    ],
  },
  {
    id: 'fp-02',
    name: 'Plan B',
    areaSqFt: 947.23,
    bhk: 3,
    type: '3BHK',
    bedrooms: 3,
    bathrooms: 2,
    rooms: [
      { label: 'LIVING ROOM', dim: "14'0\" x 12'0\"", x: 2, y: 2, w: 52, h: 44 },
      { label: 'BEDROOM', dim: "11'0\" x 10'0\"", x: 56, y: 2, w: 42, h: 30 },
      { label: 'TOILET', x: 56, y: 34, w: 20, h: 18 },
      { label: 'KITCHEN', dim: "9'0\" x 8'0\"", x: 78, y: 34, w: 20, h: 18 },
      { label: 'BEDROOM', dim: "11'6\" x 10'0\"", x: 2, y: 48, w: 40, h: 50 },
      { label: 'BEDROOM', dim: "10'0\" x 10'0\"", x: 44, y: 54, w: 32, h: 44 },
      { label: 'TOILET', x: 78, y: 54, w: 20, h: 44 },
    ],
  },
  {
    id: 'fp-03',
    name: 'Plan C',
    areaSqFt: 979.52,
    bhk: 2,
    type: '2BHK',
    bedrooms: 2,
    bathrooms: 2,
    rooms: [
      { label: 'BEDROOM', dim: "12'0\" x 11'0\"", x: 2, y: 2, w: 46, h: 40 },
      { label: 'LIVING / DINING', dim: "15'0\" x 12'0\"", x: 50, y: 2, w: 48, h: 54 },
      { label: 'TOILET', x: 2, y: 44, w: 22, h: 22 },
      { label: 'KITCHEN', dim: "9'6\" x 8'0\"", x: 26, y: 44, w: 22, h: 22 },
      { label: 'BEDROOM', dim: "11'0\" x 10'6\"", x: 2, y: 68, w: 46, h: 30 },
      { label: 'PASSAGE', x: 50, y: 58, w: 26, h: 40 },
      { label: 'TOILET', x: 78, y: 58, w: 20, h: 40 },
    ],
  },
  {
    id: 'fp-04',
    name: 'Plan D',
    areaSqFt: 893.41,
    bhk: 2,
    type: '2BHK',
    bedrooms: 2,
    bathrooms: 1,
    rooms: [
      { label: 'BED ROOM', dim: "11'0\" x 10'0\"", x: 2, y: 2, w: 44, h: 36 },
      { label: 'KITCHEN CUM DINING', dim: "13'0\" x 10'0\"", x: 48, y: 2, w: 50, h: 36 },
      { label: 'TOILET', x: 2, y: 40, w: 24, h: 24 },
      { label: 'LIVING', dim: "14'0\" x 11'0\"", x: 48, y: 40, w: 50, h: 34 },
      { label: 'BED ROOM', dim: "10'6\" x 10'0\"", x: 2, y: 66, w: 44, h: 32 },
      { label: 'PASSAGE', x: 48, y: 76, w: 50, h: 22 },
    ],
  },
  {
    id: 'fp-05',
    name: 'Plan E',
    areaSqFt: 1528.49,
    bhk: 2,
    type: '2BHK',
    bedrooms: 2,
    bathrooms: 2,
    rooms: [
      { label: 'KITCHEN', dim: "10'0\" x 8'0\"", x: 2, y: 2, w: 34, h: 30 },
      { label: 'BEDROOM', dim: "12'0\" x 11'0\"", x: 38, y: 2, w: 40, h: 30 },
      { label: 'STAIRS', x: 80, y: 2, w: 18, h: 44 },
      { label: 'TOILET', x: 2, y: 34, w: 20, h: 22 },
      { label: 'LIVING / DINING', dim: "16'0\" x 13'0\"", x: 24, y: 34, w: 54, h: 36 },
      { label: 'BEDROOM', dim: "11'0\" x 10'0\"", x: 2, y: 58, w: 20, h: 40 },
      { label: 'BALCONY', dim: "8'0\" x 5'0\"", x: 24, y: 72, w: 74, h: 26 },
      { label: 'TOILET', x: 80, y: 48, w: 18, h: 22 },
    ],
  },
  {
    id: 'fp-06',
    name: 'Plan F',
    areaSqFt: 1642.0,
    bhk: 4,
    type: '4BHK',
    bedrooms: 4,
    bathrooms: 3,
    rooms: [
      { label: 'MASTER BEDROOM', dim: "14'0\" x 12'0\"", x: 2, y: 2, w: 44, h: 34 },
      { label: 'BEDROOM', dim: "11'0\" x 10'0\"", x: 48, y: 2, w: 30, h: 34 },
      { label: 'TOILET', x: 80, y: 2, w: 18, h: 34 },
      { label: 'LIVING / DINING', dim: "18'0\" x 14'0\"", x: 2, y: 38, w: 58, h: 34 },
      { label: 'KITCHEN', dim: "10'6\" x 9'0\"", x: 62, y: 38, w: 36, h: 34 },
      { label: 'BEDROOM', dim: "11'0\" x 10'0\"", x: 2, y: 74, w: 32, h: 24 },
      { label: 'BEDROOM', dim: "10'6\" x 10'0\"", x: 36, y: 74, w: 32, h: 24 },
      { label: 'TOILET', x: 70, y: 74, w: 28, h: 24 },
    ],
  },
  {
    id: 'fp-07',
    name: 'Plan G',
    areaSqFt: 1810.5,
    bhk: 4,
    type: '4BHK',
    bedrooms: 4,
    bathrooms: 3,
    rooms: [
      { label: 'BEDROOM', dim: "12'0\" x 11'0\"", x: 2, y: 2, w: 36, h: 32 },
      { label: 'LIVING', dim: "17'0\" x 13'0\"", x: 40, y: 2, w: 40, h: 46 },
      { label: 'STAIRS', x: 82, y: 2, w: 16, h: 46 },
      { label: 'TOILET', x: 2, y: 36, w: 18, h: 20 },
      { label: 'KITCHEN', dim: "11'0\" x 9'0\"", x: 22, y: 36, w: 16, h: 20 },
      { label: 'MASTER BEDROOM', dim: "14'6\" x 12'0\"", x: 2, y: 58, w: 40, h: 40 },
      { label: 'DINING', dim: "12'0\" x 10'0\"", x: 44, y: 50, w: 36, h: 24 },
      { label: 'BEDROOM', dim: "11'0\" x 10'0\"", x: 44, y: 76, w: 36, h: 22 },
      { label: 'BEDROOM', dim: "10'0\" x 10'0\"", x: 82, y: 50, w: 16, h: 48 },
    ],
  },
  {
    id: 'fp-08',
    name: 'Plan H',
    areaSqFt: 1902.75,
    bhk: 4,
    type: '4BHK',
    bedrooms: 4,
    bathrooms: 4,
    rooms: [
      { label: 'MASTER BEDROOM', dim: "15'0\" x 12'6\"", x: 2, y: 2, w: 40, h: 36 },
      { label: 'TOILET', x: 44, y: 2, w: 16, h: 18 },
      { label: 'BEDROOM', dim: "12'0\" x 11'0\"", x: 62, y: 2, w: 36, h: 36 },
      { label: 'PASSAGE', x: 44, y: 22, w: 16, h: 54 },
      { label: 'LIVING / DINING', dim: "19'0\" x 14'0\"", x: 2, y: 40, w: 40, h: 36 },
      { label: 'KITCHEN', dim: "11'6\" x 9'6\"", x: 62, y: 40, w: 36, h: 24 },
      { label: 'TOILET', x: 62, y: 66, w: 36, h: 10 },
      { label: 'BEDROOM', dim: "12'0\" x 10'6\"", x: 2, y: 78, w: 46, h: 20 },
      { label: 'BEDROOM', dim: "11'0\" x 10'6\"", x: 50, y: 78, w: 48, h: 20 },
    ],
  },
];

export const PLANS_BY_ID = Object.fromEntries(FLOOR_PLANS.map((p) => [p.id, p]));

/** Ascending, so the chips and the filmstrip tell the same story: 2 -> 3 -> 4.
 *  (The original mockup listed them 3, 4, 2, which read as arbitrary.) */
export const BHK_FILTERS = [2, 3, 4];

/** Display order for the gallery: smallest homes first, then by area. The source
 *  array keeps its authoring order so ids stay stable. */
export const PLANS_IN_ORDER = [...FLOOR_PLANS].sort(
  (a, b) => a.bhk - b.bhk || a.areaSqFt - b.areaSqFt,
);
