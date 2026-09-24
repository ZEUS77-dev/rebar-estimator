import { formatNumber, formatCurrency } from '../../lib/units.js';

const LEVEL_STYLE = {
  moderate: { label: 'Moderate confidence', dot: 'bg-molten' },
  low: { label: 'Low confidence', dot: 'bg-molten' },
};

/** Shown whenever the point figure is anything less than "high" confidence.
 *
 *  Deliberately visible up front rather than tucked into an expandable panel:
 *  once an estimate has drifted past what this engine was actually calibrated
 *  against (a low-rise villa), the widened range IS the honest answer, and a
 *  single headline number would be false precision. The full list of WHY
 *  lives in <details> underneath, so the reasoning is one click away without
 *  cluttering the common case, which never reaches here at all - a plain
 *  villa within the calibrated range stays "high" and this renders nothing. */
export default function ConfidenceBand({ confidence, locale, currency }) {
  if (!confidence || confidence.level === 'high') return null;

  const { label, dot } = LEVEL_STYLE[confidence.level] ?? LEVEL_STYLE.moderate;
  const { tonnesLow, tonnesHigh, costLow, costHigh } = confidence.band;
  const costKnown = Number.isFinite(costLow) && Number.isFinite(costHigh);
  const top = confidence.drivers[0];

  return (
    <div className="rounded border border-molten/40 bg-molten/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-2 font-mono text-[11px] text-ink">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
          {label}
        </span>
        <span className="font-mono text-[11px] text-dim">
          Likely {formatNumber(tonnesLow, 2, locale)}–{formatNumber(tonnesHigh, 2, locale)} t
          {costKnown && (
            <>
              {' '}
              · {formatCurrency(costLow, { currency, locale })}–
              {formatCurrency(costHigh, { currency, locale })}
            </>
          )}
        </span>
      </div>

      {top && <p className="mt-2 text-xs leading-relaxed text-dim">{top.hint}</p>}

      {confidence.drivers.length > 1 && (
        <details className="mt-2">
          <summary className="cursor-pointer font-mono text-[10px] text-ink">
            Why the range — {confidence.drivers.length} factors
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-dim">
            {confidence.drivers.map((d) => (
              <li key={d.code}>
                <span className="font-medium text-ink">{d.label}.</span> {d.hint}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
