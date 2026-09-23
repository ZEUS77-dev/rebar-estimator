import { formatNumber } from '../../lib/units.js';

/** Diameter-wise quantity. Bar counts are whole 12 m lengths, which is the unit
 *  a dealer actually quotes in. */
export default function DiameterTable({ result }) {
  const { locale } = result.assumptionsUsed;

  return (
    <section className="card avoid-break overflow-hidden">
      <header className="border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">Quantity by bar diameter</h3>
        <p className="mt-0.5 text-xs text-dim">
          Unit weight per IS 1786 (d²/162). Bars counted as whole 12 m lengths.
          <span className="sm:hidden"> Scroll the table sideways for every column.</span>
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="bg-raised text-left text-xs text-ink">
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
              <tr key={d.dia} className={i % 2 ? 'bg-raised' : 'bg-panel'}>
                <td className="px-5 py-3 font-semibold text-ink">{d.dia} mm</td>
                <td className="px-3 py-3 text-right text-dim">
                  {formatNumber(d.unitWeightKgPerM, 3, locale)}
                </td>
                <td className="px-3 py-3 text-right font-medium text-ink">
                  {formatNumber(d.kg, 0, locale)}
                </td>
                <td className="px-3 py-3 text-right text-dim">
                  {formatNumber(d.tonnes, 3, locale)}
                </td>
                <td className="px-3 py-3 text-right font-medium text-ink">
                  {formatNumber(d.bars, 0, locale)}
                </td>
                <td className="px-5 py-3 text-right text-dim">
                  {formatNumber(d.sharePct, 1, locale)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-molten/60 bg-molten/[0.07]">
              <td className="px-5 py-3 font-bold text-ink">Total</td>
              <td />
              <td className="px-3 py-3 text-right font-bold text-ink">
                {formatNumber(result.totals.grossKg, 0, locale)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-ink">
                {formatNumber(result.totals.tonnes, 3, locale)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-ink">
                {formatNumber(
                  result.byDiameter.reduce((a, d) => a + d.bars, 0),
                  0,
                  locale,
                )}
              </td>
              <td className="px-5 py-3 text-right font-bold text-ink">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
