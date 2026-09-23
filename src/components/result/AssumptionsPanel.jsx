import { formatNumber } from '../../lib/units.js';
import { ELEMENT_LABELS } from '../../data/assumptions.js';
import { Disclaimer } from '../ui/Primitives.jsx';

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5">
    <dt className="shrink-0 text-dim">{label}</dt>
    <dd className="min-w-0 break-words text-right font-medium text-ink">{value}</dd>
  </div>
);

/** Everything the number depends on, on screen. If a reviewer disagrees with the
 *  estimate, this is the panel that tells them exactly which knob to turn. */
export default function AssumptionsPanel({ result }) {
  const a = result.assumptionsUsed;
  const { locale } = a;
  const pct = (v) => `${formatNumber(v * 100, 0, locale)}%`;

  return (
    <section className="card avoid-break p-5">
      <h3 className="text-sm font-semibold text-ink">Assumptions used</h3>
      <p className="mt-0.5 text-xs text-dim">
        Indicative thumb rules for low-rise residential RCC, built up per element.
      </p>

      <dl className="mt-4 divide-y divide-line text-sm">
        <Row
          label="Ground floor area"
          value={`${formatNumber(result.geometry.footprintSqFt, 2, locale)} sq ft`}
        />
        <Row label="Levels" value={`${result.input.floors} (${result.geometry.levels})`} />
        <Row
          label="Built-up area"
          value={`${formatNumber(result.geometry.builtUpSqFt, 2, locale)} sq ft`}
        />
        <Row label="Layout complexity factor" value={formatNumber(a.planFactor, 2, locale)} />
        <Row label="Wastage" value={pct(a.wastagePct)} />
        <Row label="Lap / overlap" value={pct(a.lapPct)} />
        <Row
          label="Combined multiplier"
          value={`× ${formatNumber(a.combinedMultiplier, 4, locale)}`}
        />
        <Row
          label="Footing storey factor"
          value={`× ${formatNumber(a.footingStoreyFactorApplied, 2, locale)}`}
        />
        <Row
          label="Column factor per level"
          value={a.columnLevelFactors.map((f) => formatNumber(f, 2, locale)).join(' · ')}
        />
        <Row
          label="Steel intensity"
          value={`${formatNumber(result.totals.kgPerSqFtBuiltUp, 2, locale)} kg/sq ft built-up`}
        />
      </dl>

      <details className="mt-4 rounded-lg border border-line bg-raised/60 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">
          Base rates and diameter mix
        </summary>
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <div className="font-semibold text-ink">Base rate (kg per sq ft of its own area)</div>
            <ul className="mt-1 space-y-0.5 text-dim">
              {Object.entries(a.elementRatesKgPerSqFt).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{ELEMENT_LABELS[k]}</span>
                  <span className="font-medium text-ink">{formatNumber(v, 2, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-ink">Diameter mix</div>
            <ul className="mt-1 space-y-0.5 text-dim">
              {Object.entries(a.diameterMix).map(([el, mix]) => (
                <li key={el} className="flex items-baseline justify-between gap-3">
                  <span className="shrink-0">{ELEMENT_LABELS[el]}</span>
                  <span className="min-w-0 break-words text-right font-medium text-ink">
                    {Object.entries(mix)
                      .map(([d, f]) => `${d}mm ${formatNumber(f * 100, 0, locale)}%`)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      {result.warnings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {result.warnings.map((w, i) => (
            <li
              key={i}
              className="rounded-lg border border-molten/40 bg-molten/[0.07] px-3 py-2 text-xs text-ink"
            >
              {w.message}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <Disclaimer text={a.disclaimer} />
        <p className="mt-2 text-[11px] text-dim/80">
          Generated {new Date(result.meta.generatedAt).toLocaleString(locale)} · engine v
          {result.meta.engineVersion}
        </p>
      </div>
    </section>
  );
}
