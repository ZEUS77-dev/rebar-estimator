import { formatNumber, formatCurrency } from '../../lib/units.js';

/** Element-wise split, with a share bar so the eye gets the proportions before
 *  it reads the numbers. */
export default function ElementSplit({ result }) {
  const { locale, currency } = result.assumptionsUsed;

  return (
    <section className="card avoid-break p-5">
      <h3 className="text-sm font-semibold text-navy">Split by element</h3>
      <p className="mt-0.5 text-xs text-grey">
        Grade is the recommended default per element. Grade sets the rate, not the weight.
      </p>

      <ul className="mt-5 space-y-4">
        {result.byElement.map((e) => (
          <li key={e.element}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-navy">
                {e.label}
                <span className="ml-2 rounded bg-navy/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                  {e.grade}
                </span>
              </span>
              <span className="text-sm text-grey">
                <strong className="font-semibold text-navy">
                  {formatNumber(e.grossKg, 0, locale)} kg
                </strong>
                <span className="mx-1.5 text-grey/50">·</span>
                {formatNumber(e.tonnes, 3, locale)} t
                <span className="mx-1.5 text-grey/50">·</span>
                {formatCurrency(e.costInr, { currency, locale })}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-grey/15">
                <div
                  className="h-full rounded-full bg-panther"
                  style={{ width: `${e.sharePct.toFixed(2)}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-medium text-grey">
                {formatNumber(e.sharePct, 1, locale)}%
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-grey/15 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">By grade</h4>
        <ul className="mt-2 space-y-1.5">
          {result.byGrade.map((g) => (
            <li key={g.grade} className="flex justify-between text-sm">
              <span className="text-navy">{g.grade}</span>
              <span className="text-grey">
                {formatNumber(g.tonnes, 3, locale)} t @{' '}
                {formatCurrency(g.ratePerTonne, { currency, locale })}/t ={' '}
                <strong className="font-semibold text-navy">
                  {formatCurrency(g.costInr, { currency, locale })}
                </strong>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
