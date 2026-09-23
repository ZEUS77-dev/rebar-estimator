/** Step 3, laid out like a slide sorter: a filmstrip of plans down the left,
 *  the selected plan drawn large in the middle, its specs down the right.
 *
 *  Clicking a thumbnail IS the selection — there is no separate confirm, the
 *  wizard's own Next does that job. Which also means no local preview state:
 *  what the pane shows is simply what is selected. */

import { useMemo } from 'react';
import { Chip, CheckIcon } from '../ui/Primitives.jsx';
import FloorPlanSvg from '../plans/FloorPlanSvg.jsx';
import { PLANS_IN_ORDER, BHK_FILTERS, PLANS_BY_ID } from '../../data/floorPlans.js';
import { DEFAULT_ASSUMPTIONS } from '../../data/assumptions.js';
import { formatNumber } from '../../lib/units.js';

export default function StepPlan({ state, dispatch, assumptions = DEFAULT_ASSUMPTIONS }) {
  const plans = useMemo(
    () =>
      state.bhkFilter
        ? PLANS_IN_ORDER.filter((p) => p.bhk === state.bhkFilter)
        : PLANS_IN_ORDER,
    [state.bhkFilter],
  );

  const chosen = state.planId ? PLANS_BY_ID[state.planId] : null;
  // A filter can hide the chosen plan; the pane then previews the first one in
  // view so the right-hand side is never empty.
  const inView = chosen && plans.some((p) => p.id === chosen.id);
  const viewing = inView ? chosen : (plans[0] ?? null);
  const isChosen = Boolean(viewing && chosen && viewing.id === chosen.id);

  const factorOf = (p) => p.planFactor ?? assumptions.planFactorByBhk[p.bhk] ?? 1;

  return (
    <div className="stagger px-4 py-6 sm:px-8">
      {/* Title and filters share a row — three stacked centred blocks cost a
          lot of height for very little. */}
      <div
        className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3"
        style={{ '--i': 0 }}
      >
        <div className="min-w-0">
          <p className="label-eyebrow">Step 3</p>
          <h2 className="mt-1 text-lg text-ink sm:text-xl">
            Select a floor plan similar to your home
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BHK_FILTERS.map((b) => (
            <Chip
              key={b}
              selected={state.bhkFilter === b}
              onClick={() => dispatch({ type: 'setBhkFilter', value: b })}
            >
              {b}BHK
            </Chip>
          ))}
          {state.bhkFilter && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'setBhkFilter', value: state.bhkFilter })}
              className="font-mono text-xs text-dim underline underline-offset-4 hover:text-molten"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[150px_1fr]" style={{ '--i': 1 }}>
        {/* ---- filmstrip: a row on mobile, a rail on desktop ------------- */}
        <ol
          aria-label="Floor plans"
          className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[clamp(18rem,52vh,30rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-2"
        >
          {plans.map((p, i) => {
            const active = viewing && viewing.id === p.id;
            const picked = chosen && chosen.id === p.id;
            return (
              <li key={p.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'setPlan', value: p.id })}
                  aria-current={active ? 'true' : undefined}
                  className={[
                    'flex w-36 items-start gap-2 rounded border p-1.5 text-left transition-colors lg:w-full',
                    active
                      ? 'border-molten bg-molten/[0.07]'
                      : 'border-line bg-panel hover:border-dim',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'mt-1 w-5 shrink-0 text-center font-mono text-[10px] tabular-nums',
                      active ? 'text-molten' : 'text-dim',
                    ].join(' ')}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block aspect-[4/3] overflow-hidden rounded-sm bg-base">
                      <FloorPlanSvg plan={p} compact />
                    </span>
                    <span className="mt-1.5 flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-dim">{p.type}</span>
                      {picked && (
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-molten text-base">
                          <CheckIcon className="h-2 w-2" />
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {!plans.length && (
            <li className="py-10 text-center text-sm text-dim">No plans for this filter.</li>
          )}
        </ol>

        {/* ---- detail pane ---------------------------------------------- */}
        {viewing ? (
          <div className="min-w-0">
            {/* Drawing and specs sit side by side: the specs read as a spec
                sheet beside the drawing rather than a strip underneath it, and
                the pair costs one row of height instead of two. */}
            <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
              {/* Height-led rather than aspect-led: the drawing takes what the
                  viewport can spare, so the step fits a screen. */}
              <div className="rounded-lg border border-line bg-base p-3 sm:p-4">
                {/* Keyed so the drawing redraws as you move along the strip. */}
                <div
                  key={viewing.id}
                  className="mx-auto h-[clamp(15rem,44vh,25rem)] w-full animate-rise"
                >
                  <FloorPlanSvg plan={viewing} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isChosen && (
                  <p className="flex items-center gap-1.5 font-mono text-[11px] text-molten">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-molten text-base">
                      <CheckIcon className="h-2.5 w-2.5" />
                    </span>
                    Selected
                  </p>
                )}

                <dl className="divide-y divide-line overflow-hidden rounded border border-line bg-panel">
                  <Spec k="Area" v={`${formatNumber(viewing.areaSqFt, 2)} sq ft`} accent />
                  <Spec k="Type" v={viewing.type} />
                  <Spec k="Rooms" v={`${viewing.bedrooms} bed · ${viewing.bathrooms} bath`} />
                  <Spec k="Layout factor" v={`× ${formatNumber(factorOf(viewing), 2)}`} />
                </dl>

                <p className="text-[11px] leading-relaxed text-dim">
                  {isChosen
                    ? 'Used for the layout factor. Press Next to continue.'
                    : 'Pick a plan from the strip. Optional — without one the estimate assumes a simple rectangular layout (factor 1.00).'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-line bg-base p-10 text-sm text-dim">
            Nothing to show for this filter.
          </div>
        )}
      </div>
    </div>
  );
}

/** A stacked row rather than a grid cell — the spec sheet reads down the page
 *  now, not across it. */
function Spec({ k, v, accent }) {
  return (
    <div className="px-3 py-2">
      <dt className="label-key">{k}</dt>
      <dd
        className={`mt-0.5 font-mono text-xs leading-snug tabular-nums ${
          accent ? 'text-molten' : 'text-ink'
        }`}
      >
        {v}
      </dd>
    </div>
  );
}
