import { formatNumber } from '../../lib/units.js';
import { ELEMENT_LABELS } from '../../data/assumptions.js';
import { Disclaimer } from '../ui/Primitives.jsx';

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5">
    <dt className="text-grey">{label}</dt>
    <dd className="text-right font-medium text-charcoal">{value}</dd>
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
      <h3 className="text-sm font-semibold text-charcoal">Assumptions used</h3>
      <p className="mt-0.5 text-xs text-grey">
        Indicative thumb rules for low-rise residential RCC, built up per element.
      </p>

      <dl className="mt-4 divide-y divide-grey-light text-sm">
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

      <details className="mt-4 rounded-lg border border-grey-light bg-grey-light/60 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-charcoal">
          Base rates and diameter mix
        </summary>
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <div className="font-semibold text-charcoal">Base rate (kg per sq ft of its own area)</div>
            <ul className="mt-1 space-y-0.5 text-grey">
              {Object.entries(a.elementRatesKgPerSqFt).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{ELEMENT_LABELS[k]}</span>
                  <span className="font-medium text-charcoal">{formatNumber(v, 2, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-charcoal">Diameter mix</div>
            <ul className="mt-1 space-y-0.5 text-grey">
              {Object.entries(a.diameterMix).map(([el, mix]) => (
                <li key={el} className="flex justify-between gap-3">
                  <span className="shrink-0">{ELEMENT_LABELS[el]}</span>
                  <span className="text-right font-medium text-charcoal">
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
              className="rounded-lg border border-primary/40 bg-primary/[0.06] px-3 py-2 text-xs text-charcoal"
            >
              {w.message}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-grey-light pt-3">
        <Disclaimer text={a.disclaimer} />
        <p className="mt-2 text-[11px] text-grey/80">
          Generated {new Date(result.meta.generatedAt).toLocaleString(locale)} · engine v
          {result.meta.engineVersion}
        </p>
      </div>
    </section>
  );
}
