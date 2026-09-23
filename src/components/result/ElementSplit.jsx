import { formatNumber, formatCurrency } from '../../lib/units.js';

/** Element-wise split, with a share bar so the eye gets the proportions before
 *  it reads the numbers. */
export default function ElementSplit({ result }) {
  const { locale, currency } = result.assumptionsUsed;

  return (
    <section className="card avoid-break p-5">
      <h3 className="text-sm font-semibold text-ink">Split by element</h3>
      <p className="mt-0.5 text-xs text-dim">
        Grade is the recommended default per element. Grade sets the rate, not the weight.
      </p>

      <ul className="mt-5 space-y-4">
        {result.byElement.map((e) => (
          <li key={e.element}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-ink">
                {e.label}
                <span className="ml-2 rounded bg-raised px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                  {e.grade}
                </span>
              </span>
              <span className="text-sm text-dim">
                <strong className="font-semibold text-ink">
                  {formatNumber(e.grossKg, 0, locale)} kg
                </strong>
                <span className="mx-1.5 text-dim/50">·</span>
                {formatNumber(e.tonnes, 3, locale)} t
                <span className="mx-1.5 text-dim/50">·</span>
                {formatCurrency(e.cost, { currency, locale })}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full bg-molten"
                  style={{ width: `${e.sharePct.toFixed(2)}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-medium text-dim">
                {formatNumber(e.sharePct, 1, locale)}%
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-line pt-4">
        <h4 className="text-xs font-semibold text-molten">By grade</h4>
        <ul className="mt-2 space-y-1.5">
          {result.byGrade.map((g) => (
            <li key={g.grade} className="flex justify-between text-sm">
              <span className="text-ink">{g.grade}</span>
              <span className="text-dim">
                {formatNumber(g.tonnes, 3, locale)} t @{' '}
                {formatCurrency(g.ratePerTonne, { currency, locale })}/t ={' '}
                <strong className="font-semibold text-ink">
                  {formatCurrency(g.cost, { currency, locale })}
                </strong>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
