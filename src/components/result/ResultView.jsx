import DiameterTable from './DiameterTable.jsx';
import ElementSplit from './ElementSplit.jsx';
import CostCard from './CostCard.jsx';
import AssumptionsPanel from './AssumptionsPanel.jsx';
import PrintShareBar from './PrintShareBar.jsx';
import { ArrowLeft, Disclaimer } from '../ui/Primitives.jsx';
import { formatNumber, formatCurrency, formatArea } from '../../lib/units.js';
import { SCOPES_BY_ID } from '../../data/assumptions.js';

function Stat({ label, value, sub, emphasis }) {
  return (
    <div
      className={[
        'rounded-xl px-5 py-4',
        emphasis ? 'bg-panther text-white' : 'border border-grey/15 bg-white',
      ].join(' ')}
    >
      <div className={`text-[11px] uppercase tracking-wide ${emphasis ? 'text-white/80' : 'text-primary'}`}>
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${emphasis ? 'text-white' : 'text-navy'}`}>
        {value}
      </div>
      {sub && (
        <div className={`mt-0.5 text-xs ${emphasis ? 'text-white/80' : 'text-grey'}`}>{sub}</div>
      )}
    </div>
  );
}

export default function ResultView({ result, state, dispatch, onBack, onRestart, assumptions }) {
  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="px-4 py-12 text-center sm:px-8">
        <h2 className="text-lg font-semibold text-navy">We can’t calculate this yet</h2>
        <ul className="mx-auto mt-3 max-w-md space-y-1 text-sm text-primary-700">
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
  const costKnown = Number.isFinite(result.totals.costInr);

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow">Your estimate</p>
          <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">
            {scopeLabel} · {result.input.floors}
          </h2>
          <p className="mt-1 text-sm text-grey">
            {formatArea(result.geometry.footprintSqFt, 'sqft', locale)} ground floor ·{' '}
            {formatArea(result.geometry.builtUpSqFt, 'sqft', locale)} built-up
            {result.input.planType ? ` · ${result.input.planType} plan` : ''}
          </p>
        </div>
        <button type="button" className="btn-ghost no-print !px-5 !py-2.5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          emphasis
          label="Total TMT rebar"
          value={`${formatNumber(result.totals.tonnes, 3, locale)} t`}
          sub={`${formatNumber(result.totals.grossKg, 0, locale)} kg including wastage and lap`}
        />
        <Stat
          label="Indicative cost"
          value={costKnown ? formatCurrency(result.totals.costInr, { currency, locale }) : '—'}
          sub={
            costKnown
              ? `at ${formatCurrency(result.totals.blendedRatePerTonne, { currency, locale })} per tonne`
              : 'enter a rate per tonne'
          }
        />
        <Stat
          label="Steel intensity"
          value={`${formatNumber(result.totals.kgPerSqFtBuiltUp, 2, locale)} kg/sq ft`}
          sub="of built-up area · typical range 3.5 – 4.5"
        />
      </div>

      <div className="mt-6">
        <PrintShareBar result={result} onRestart={onRestart} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <DiameterTable result={result} />
          <ElementSplit result={result} />
        </div>
        <div className="space-y-5">
          <CostCard result={result} state={state} dispatch={dispatch} assumptions={assumptions} />
          <AssumptionsPanel result={result} />
        </div>
      </div>

      {/* Print-only footer: the disclaimer must survive every export path. */}
      <div className="print-only mt-6 border-t border-grey/30 pt-3">
        <Disclaimer text={result.assumptionsUsed.disclaimer} />
      </div>
    </div>
  );
}
