/** TMT bar physical constants.
 *  Nominal unit weight per IS 1786: kg/m = d^2 / 162.
 *  8-25 mm is the working set for residential G to G+2 construction. */

export const BAR_LENGTH_M = 12;

export const DIAMETERS_MM = [8, 10, 12, 16, 20, 25];

/** kg per running metre for a bar of diameter d (mm). */
export const unitWeightKgPerM = (d) => (d * d) / 162;

/** kg in one 12 m stock bar: 12 * d^2/162 = d^2/13.5 */
export const kgPer12mBar = (d) => unitWeightKgPerM(d) * BAR_LENGTH_M;

/** Whole 12 m bars needed to cover `kg` of diameter `d`. Always at least 1 if any steel is needed. */
export const barsFromKg = (kg, d) => (kg > 0 ? Math.ceil(kg / kgPer12mBar(d)) : 0);

/** Running metres represented by `kg` of diameter `d`. */
export const lengthMFromKg = (kg, d) => kg / unitWeightKgPerM(d);
