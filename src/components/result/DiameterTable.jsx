import { formatNumber } from '../../lib/units.js';

/** Diameter-wise quantity. Bar counts are whole 12 m lengths, which is the unit
 *  a dealer actually quotes in. */
export default function DiameterTable({ result }) {
  const { locale } = result.assumptionsUsed;

  return (
    <section className="card avoid-break overflow-hidden">
      <header className="border-b border-grey-light px-5 py-4">
        <h3 className="text-sm font-semibold text-charcoal">Quantity by bar diameter</h3>
        <p className="mt-0.5 text-xs text-grey">
          Unit weight per IS 1786 (d²/162). Bars counted as whole 12 m lengths.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="bg-charcoal text-left text-xs uppercase tracking-wide text-white">
              <th className="px-5 py-3 font-medium">Dia</th>
              <th className="px-3 py-3 text-right font-medium">kg/m</th>
              <th className="px-3 py-3 text-right font-medium">Weight (kg)</th>
              <th className="px-3 py-3 text-right font-medium">Tonnes</th>
              <th className="px-3 py-3 text-right font-medium">12 m bars</th>
              <th className="px-5 py-3 text-right font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {result.byDiameter.map((d, i) => (
              <tr key={d.dia} className={i % 2 ? 'bg-grey-light' : 'bg-white'}>
                <td className="px-5 py-3 font-semibold text-charcoal">{d.dia} mm</td>
                <td className="px-3 py-3 text-right text-grey">
                  {formatNumber(d.unitWeightKgPerM, 3, locale)}
                </td>
                <td className="px-3 py-3 text-right font-medium text-charcoal">
                  {formatNumber(d.kg, 0, locale)}
                </td>
                <td className="px-3 py-3 text-right text-grey">
                  {formatNumber(d.tonnes, 3, locale)}
                </td>
                <td className="px-3 py-3 text-right font-medium text-charcoal">
                  {formatNumber(d.bars, 0, locale)}
                </td>
                <td className="px-5 py-3 text-right text-grey">
                  {formatNumber(d.sharePct, 1, locale)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-primary bg-primary/[0.06]">
              <td className="px-5 py-3 font-bold text-charcoal">Total</td>
              <td />
              <td className="px-3 py-3 text-right font-bold text-charcoal">
                {formatNumber(result.totals.grossKg, 0, locale)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-charcoal">
                {formatNumber(result.totals.tonnes, 3, locale)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-charcoal">
                {formatNumber(
                  result.byDiameter.reduce((a, d) => a + d.bars, 0),
                  0,
                  locale,
                )}
              </td>
              <td className="px-5 py-3 text-right font-bold text-charcoal">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
