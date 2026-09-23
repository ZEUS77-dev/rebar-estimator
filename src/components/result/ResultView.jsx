import DiameterTable from './DiameterTable.jsx';
import ElementSplit from './ElementSplit.jsx';
import CostCard from './CostCard.jsx';
import AssumptionsPanel from './AssumptionsPanel.jsx';
import PrintShareBar from './PrintShareBar.jsx';
import { ArrowLeft, Disclaimer } from '../ui/Primitives.jsx';
import { formatNumber, formatCurrency, formatArea } from '../../lib/units.js';
import { SCOPES_BY_ID } from '../../data/assumptions.js';

/** The headline figure is the payoff of the whole wizard, so it gets the only
 *  molten fill on the page — everything else stays cold steel. */
function Stat({ label, value, sub, emphasis, i = 0 }) {
  return (
    <div
      style={{ '--i': i }}
      className={[
        'relative overflow-hidden rounded border px-5 py-5',
        emphasis ? 'border-molten/60 bg-molten/[0.09]' : 'border-line bg-panel',
      ].join(' ')}
    >
      {emphasis && (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/2 h-32 w-48 -translate-x-1/2 animate-heat rounded-full bg-molten/30 blur-2xl"
        />
      )}
      <div className="label-key relative">{label}</div>
      <div
        className={[
          'relative mt-2 font-mono tabular-nums',
          emphasis ? 'text-3xl font-bold text-molten' : 'text-2xl font-medium text-ink',
        ].join(' ')}
      >
        {value}
      </div>
      {sub && <div className="relative mt-1.5 text-xs leading-relaxed text-dim">{sub}</div>}
    </div>
  );
}

export default function ResultView({ result, state, dispatch, onBack, onRestart, assumptions }) {
  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="px-4 py-12 text-center sm:px-8">
        <h2 className="text-lg font-semibold text-ink">We can’t calculate this yet</h2>
        <ul className="mx-auto mt-3 max-w-md space-y-1 text-sm text-molten">
          {result.errors.map((e, i) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
        <button type="button" className="btn-ghost mt-6" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  const { locale, currency } = result.assumptionsUsed;
  const scopeLabel = SCOPES_BY_ID[result.input.scope].label;
  const costKnown = Number.isFinite(result.totals.cost);

  return (
    <div className="stagger px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4" style={{ '--i': 0 }}>
        <div>
          <p className="label-eyebrow">Your estimate</p>
          <h2 className="mt-3 text-2xl text-ink sm:text-3xl">
            {scopeLabel} <span className="text-dim">·</span> {result.input.floors}
          </h2>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-dim">
            {formatArea(result.geometry.footprintSqFt, 'sqft', locale)} ground floor ·{' '}
            {formatArea(result.geometry.builtUpSqFt, 'sqft', locale)} built-up
            {result.input.planType ? ` · ${result.input.planType} plan` : ''}
          </p>
        </div>
        <button type="button" className="btn-ghost no-print !px-5 !py-2.5" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3" style={{ '--i': 1 }}>
        <Stat
          emphasis
          i={1}
          label="Total rebar"
          value={`${formatNumber(result.totals.tonnes, 3, locale)} t`}
          sub={`${formatNumber(result.totals.grossKg, 0, locale)} kg including wastage and lap`}
        />
        <Stat
          i={2}
          label="Indicative cost"
          value={costKnown ? formatCurrency(result.totals.cost, { currency, locale }) : '—'}
          sub={
            costKnown
              ? `at ${formatCurrency(result.totals.blendedRatePerTonne, { currency, locale })} per tonne`
              : 'enter a rate per tonne'
          }
        />
        <Stat
          i={3}
          label="Steel intensity"
          value={`${formatNumber(result.totals.kgPerSqFtBuiltUp, 2, locale)} kg/sq ft`}
          sub="of built-up area · typical range 3.5 – 4.5"
        />
      </div>

      <div className="mt-5">
        <PrintShareBar result={result} onRestart={onRestart} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <DiameterTable result={result} />
          <ElementSplit result={result} />
        </div>
        <div className="space-y-4">
          <CostCard result={result} state={state} dispatch={dispatch} assumptions={assumptions} />
          <AssumptionsPanel result={result} />
        </div>
      </div>

      {/* Print-only footer: the disclaimer must survive every export path. */}
      <div className="print-only mt-6 border-t border-line pt-3">
        <Disclaimer text={result.assumptionsUsed.disclaimer} />
      </div>
    </div>
  );
}
