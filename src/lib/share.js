/** Export helpers: a plain-text summary and the print trigger.
 *
 *  The disclaimer is appended by buildSummary itself, not by the caller, so it
 *  cannot be dropped from a share or a copy. */

import { formatNumber, formatCurrency, formatArea } from './units.js';
import { SCOPES_BY_ID } from '../data/assumptions.js';

export function buildSummary(result) {
  if (!result || !result.ok) return '';
  const { locale, currency, disclaimer } = result.assumptionsUsed;
  const money = (v) => formatCurrency(v, { currency, locale });
  const L = [];

  L.push('JINDAL STEEL OMAN — REBAR ESTIMATE');
  L.push('=================================');
  L.push('');
  L.push(`Ground floor area : ${formatArea(result.geometry.footprintSqFt, 'sqft', locale)}`);
  L.push(`Floors            : ${result.input.floors} (${result.geometry.levels} level(s))`);
  L.push(`Built-up area     : ${formatArea(result.geometry.builtUpSqFt, 'sqft', locale)}`);
  if (result.input.planType) L.push(`Floor plan        : ${result.input.planType}`);
  L.push(`Estimate for      : ${SCOPES_BY_ID[result.input.scope].label}`);
  L.push('');
  L.push(`TOTAL TMT REBAR   : ${formatNumber(result.totals.tonnes, 3, locale)} tonnes`);
  L.push(`                    (${formatNumber(result.totals.grossKg, 0, locale)} kg)`);
  L.push(`Indicative cost   : ${money(result.totals.cost)}`);
  L.push(
    `Steel intensity   : ${formatNumber(result.totals.kgPerSqFtBuiltUp, 2, locale)} kg/sq.ft of built-up area`,
  );
  L.push('');
  L.push('BY BAR DIAMETER');
  L.push('---------------');
  for (const d of result.byDiameter) {
    L.push(
      `  ${String(d.dia).padStart(2)} mm : ${formatNumber(d.kg, 0, locale).padStart(7)} kg  |  ` +
        `${formatNumber(d.tonnes, 3, locale)} t  |  ${d.bars} nos. of 12 m bars`,
    );
  }
  L.push('');
  L.push('BY ELEMENT');
  L.push('----------');
  for (const e of result.byElement) {
    L.push(
      `  ${e.label.padEnd(18)} ${formatNumber(e.grossKg, 0, locale).padStart(7)} kg  ` +
        `(${formatNumber(e.sharePct, 1, locale)}%)  ${e.grade}`,
    );
  }
  L.push('');
  L.push('BY GRADE');
  L.push('--------');
  for (const g of result.byGrade) {
    L.push(
      `  ${g.grade.padEnd(8)} ${formatNumber(g.tonnes, 3, locale)} t @ ${money(g.ratePerTonne)}/t  =  ${money(g.cost)}`,
    );
  }
  L.push('');
  L.push('ASSUMPTIONS');
  L.push('-----------');
  L.push(`  Wastage ${formatNumber(result.assumptionsUsed.wastagePct * 100, 0)}%` +
    ` · Lap ${formatNumber(result.assumptionsUsed.lapPct * 100, 0)}%` +
    ` · Layout factor ${formatNumber(result.assumptionsUsed.planFactor, 2)}`);
  L.push(`  Stock bar length 12 m · Unit weight per IS 1786 (d²/162)`);
  L.push('');
  L.push(`Generated ${new Date(result.meta.generatedAt).toLocaleString(locale)} · engine v${result.meta.engineVersion}`);
  L.push('');
  L.push(disclaimer);

  return L.join('\n');
}

/** Copy to clipboard, falling back to a hidden textarea where the async API is
 *  blocked (file:// origins, older browsers). */
export async function copySummary(result) {
  const text = buildSummary(result);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function whatsappUrl(result) {
  return `https://wa.me/?text=${encodeURIComponent(buildSummary(result))}`;
}

export function downloadSummary(result, filename = 'rebar-estimate.txt') {
  const blob = new Blob([buildSummary(result)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printEstimate() {
  window.print();
}
