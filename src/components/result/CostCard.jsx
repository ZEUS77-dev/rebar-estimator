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
  const costKnown = Number.isFinite(result.totals.cost);

  return (
    <section className="card avoid-break p-5">
      <h3 className="text-sm font-semibold text-ink">Indicative cost</h3>
      <p className="mt-0.5 text-xs text-dim">
        {result.input.scope === 'full'
          ? 'For the full house.'
          : `For ${scopeLabel.toLowerCase()} only.`}{' '}
        Rebar only — no cement, aggregate, labour, transport or taxes.
      </p>

      <div className="mt-4">
        <label htmlFor="rate" className="text-xs font-medium text-dim">
          Rate per tonne {usingDefaults && <span className="text-dim/70">(grade-wise default)</span>}
        </label>
        <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-line bg-panel focus-within:border-molten">
          <span className="border-r border-line bg-raised px-3 py-2.5 text-sm text-dim">
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
            className="w-full px-3 py-2.5 text-sm font-medium text-ink outline-none"
          />
          <span className="px-3 py-2.5 text-sm text-dim">/ tonne</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[11px] text-dim">
            Clamped to {formatCurrency(min, { currency, locale })} –{' '}
            {formatCurrency(max, { currency, locale })}
          </p>
          {!usingDefaults && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'setRate', value: null })}
              className="text-[11px] font-medium text-molten underline underline-offset-2"
            >
              Reset to defaults
            </button>
          )}
        </div>
      </div>

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-dim">Total quantity</dt>
          <dd className="font-medium text-ink">
            {formatNumber(result.totals.tonnes, 3, locale)} t
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-dim">Effective rate</dt>
          <dd className="font-medium text-ink">
            {costKnown
              ? `${formatCurrency(result.totals.blendedRatePerTonne, { currency, locale })} / t`
              : '—'}
          </dd>
        </div>
      </dl>

      {/* Solid molten fill, so the type takes the page ground: light on day's
          deep orange, dark on night's bright one. */}
      <div className="mt-4 rounded bg-molten px-5 py-4 text-base">
        <div className="label-key !text-base/75">Estimated rebar cost</div>
        <div className="mt-1 font-mono text-2xl font-bold tabular-nums">
          {costKnown ? formatCurrency(result.totals.cost, { currency, locale }) : '—'}
        </div>
      </div>
    </section>
  );
}
