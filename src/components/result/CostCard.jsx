import { formatNumber, formatCurrency } from '../../lib/units.js';
import { SCOPES_BY_ID, DEFAULT_ASSUMPTIONS } from '../../data/assumptions.js';

/** Indicative cost with an editable rate.
 *
 *  Editing the rate goes through recost() upstream, so a keystroke re-prices
 *  without re-running the estimate - the tonnage above never flickers. */
export default function CostCard({ result, state, dispatch, assumptions = DEFAULT_ASSUMPTIONS }) {
  const { locale, currency } = result.assumptionsUsed;
  const { min, max } = assumptions.rateLimits;
  const usingDefaults = state.rate === null || state.rate === '';
  const scopeLabel = SCOPES_BY_ID[result.input.scope].label;
  const costKnown = Number.isFinite(result.totals.costInr);

  return (
    <section className="card avoid-break p-5">
      <h3 className="text-sm font-semibold text-navy">Indicative cost</h3>
      <p className="mt-0.5 text-xs text-grey">
        {result.input.scope === 'full'
          ? 'For the full house.'
          : `For ${scopeLabel.toLowerCase()} only.`}{' '}
        Rebar only — no cement, aggregate, labour, transport or taxes.
      </p>

      <div className="mt-4">
        <label htmlFor="rate" className="text-xs font-medium text-grey">
          Rate per tonne {usingDefaults && <span className="text-grey/70">(grade-wise default)</span>}
        </label>
        <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-grey/25 bg-white focus-within:border-primary">
          <span className="border-r border-grey/20 bg-grey-light px-3 py-2.5 text-sm text-grey">
            {assumptions.currencySymbol}
          </span>
          <input
            id="rate"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={500}
            placeholder={usingDefaults ? formatNumber(result.totals.blendedRatePerTonne, 0, locale) : ''}
            value={state.rate ?? ''}
            onChange={(e) => dispatch({ type: 'setRate', value: e.target.value })}
            className="w-full px-3 py-2.5 text-sm font-medium text-navy outline-none"
          />
          <span className="px-3 py-2.5 text-sm text-grey">/ tonne</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[11px] text-grey">
            Clamped to {formatCurrency(min, { currency, locale })} –{' '}
            {formatCurrency(max, { currency, locale })}
          </p>
          {!usingDefaults && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'setRate', value: null })}
              className="text-[11px] font-medium text-primary underline underline-offset-2"
            >
              Reset to defaults
            </button>
          )}
        </div>
      </div>

      <dl className="mt-5 space-y-2 border-t border-grey/15 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-grey">Total quantity</dt>
          <dd className="font-medium text-navy">
            {formatNumber(result.totals.tonnes, 3, locale)} t
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-grey">Effective rate</dt>
          <dd className="font-medium text-navy">
            {costKnown
              ? `${formatCurrency(result.totals.blendedRatePerTonne, { currency, locale })} / t`
              : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl bg-panther px-5 py-4 text-white">
        <div className="text-xs uppercase tracking-wide text-white/80">Estimated rebar cost</div>
        <div className="mt-1 text-2xl font-bold">
          {costKnown ? formatCurrency(result.totals.costInr, { currency, locale }) : '—'}
        </div>
      </div>
    </section>
  );
}
