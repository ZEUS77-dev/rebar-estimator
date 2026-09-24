/** Step 3, laid out like a slide sorter: a filmstrip of plans down the left,
 *  the selected plan drawn large in the middle, its specs down the right.
 *
 *  Clicking a thumbnail IS the selection — there is no separate confirm, the
 *  wizard's own Next does that job. Which also means no local preview state:
 *  what the pane shows is simply what is selected. */

import { lazy, Suspense, useMemo, useState } from 'react';
import { Chip, CheckIcon } from '../ui/Primitives.jsx';
import FloorPlanSvg from '../plans/FloorPlanSvg.jsx';
import { PLANS_IN_ORDER, BHK_FILTERS, PLANS_BY_ID } from '../../data/floorPlans.js';
import { DEFAULT_ASSUMPTIONS } from '../../data/assumptions.js';
import { formatNumber, formatArea, sqmToSqft, normalizeArea, round, convertArea } from '../../lib/units.js';
import { roundAreaSqFt, PLAN_AREA_MISMATCH_THRESHOLD } from '../../lib/validation.js';

// Lazy-loaded: nothing in Plan Studio (the SVG viewport, the trace reducer)
// should cost the homeowner path a single byte unless they actually open it.
const PlanStudio = lazy(() => import('../studio/PlanStudio.jsx'));
const TracePreview = lazy(() => import('../studio/TracePreview.jsx'));

export default function StepPlan({ state, dispatch, assumptions = DEFAULT_ASSUMPTIONS }) {
  const [studioOpen, setStudioOpen] = useState(false);
  // A finished trace whose area meaningfully disagrees with what was typed on
  // step 1 waits here until the user picks which number is real, rather than
  // silently living with both (see AreaConfirmDialog below).
  const [pendingTrace, setPendingTrace] = useState(null);
  const traced = state.planSource === 'traced' ? state.trace : null;
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

  // A trace just came back from the Studio. If its area is close enough to
  // what was typed on step 1, there's nothing to decide - just use it. If not,
  // hold it and ask which number the rest of the estimate should be built on.
  const handleUseTrace = (trace) => {
    const enteredSqFt = roundAreaSqFt(normalizeArea(state.area, state.unit), assumptions);
    const tracedSqFt = sqmToSqft(trace.geometry.derived.areaSqM);
    const deviation = enteredSqFt ? Math.abs(tracedSqFt - enteredSqFt) / enteredSqFt : 0;

    if (deviation <= PLAN_AREA_MISMATCH_THRESHOLD) {
      dispatch({ type: 'setTrace', value: trace });
      setStudioOpen(false);
      return;
    }
    setPendingTrace(trace);
    setStudioOpen(false);
  };

  const resolvePendingTrace = (useTracedArea) => {
    if (!pendingTrace) return;
    if (useTracedArea) {
      const areaInCurrentUnit =
        state.unit === 'sqm' ? pendingTrace.geometry.derived.areaSqM : sqmToSqft(pendingTrace.geometry.derived.areaSqM);
      dispatch({ type: 'setArea', value: String(round(areaInCurrentUnit, 2)) });
    }
    dispatch({ type: 'setTrace', value: pendingTrace });
    setPendingTrace(null);
  };

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
          <button type="button" onClick={() => setStudioOpen(true)} className="btn-ghost">
            {state.trace ? 'Re-trace my plan' : 'Trace my own plan'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[150px_1fr]" style={{ '--i': 1 }}>
        {/* ---- filmstrip: a row on mobile, a rail on desktop ------------- */}
        <ol
          aria-label="Floor plans"
          className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[clamp(18rem,52vh,30rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-2"
        >
          {state.trace && (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => dispatch({ type: 'setPlanSource', value: 'traced' })}
                aria-current={traced ? 'true' : undefined}
                className={[
                  'flex w-36 items-start gap-2 rounded border p-1.5 text-left transition-colors lg:w-full',
                  traced ? 'border-molten bg-molten/[0.07]' : 'border-line bg-panel hover:border-dim',
                ].join(' ')}
              >
                <span className={['mt-1 w-5 shrink-0 text-center font-mono text-[10px]', traced ? 'text-molten' : 'text-dim'].join(' ')}>
                  ✎
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm bg-base text-[9px] text-dim">
                    Traced
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] text-dim">Your plan</span>
                    {traced && (
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-molten text-base">
                        <CheckIcon className="h-2 w-2" />
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          )}
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
        {traced ? (
          <TracedDetail trace={traced} onRetrace={() => setStudioOpen(true)} />
        ) : viewing ? (
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

      {studioOpen && (
        <Suspense fallback={null}>
          <PlanStudio onClose={() => setStudioOpen(false)} onUseTrace={handleUseTrace} />
        </Suspense>
      )}

      {pendingTrace && (
        <AreaConfirmDialog
          enteredSqFt={roundAreaSqFt(normalizeArea(state.area, state.unit), assumptions)}
          unit={state.unit}
          tracedSqFt={sqmToSqft(pendingTrace.geometry.derived.areaSqM)}
          onKeepEntered={() => resolvePendingTrace(false)}
          onUseTraced={() => resolvePendingTrace(true)}
        />
      )}
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

/** The traced-plan equivalent of the gallery's detail pane - a summary of
 *  what was measured instead of a drawing, since there is no room-by-room
 *  layout to draw for a traced outline. */
function TracedDetail({ trace, onRetrace }) {
  const d = trace.geometry.derived;
  return (
    <div className="min-w-0">
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <div className="relative h-[clamp(15rem,44vh,25rem)] overflow-hidden rounded-lg border border-line bg-base p-3 sm:p-4">
          {trace.preview ? (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-dim">
                  Loading your drawing…
                </div>
              }
            >
              <TracePreview preview={trace.preview} geometry={trace.geometry} className="h-full w-full" />
            </Suspense>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-dim">Traced from your uploaded plan</p>
            </div>
          )}
          <button
            type="button"
            onClick={onRetrace}
            className="btn-ghost absolute right-3 top-3 !bg-panel/85 !px-3 !py-1.5 !text-[10px] backdrop-blur-sm"
          >
            Re-trace
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-molten">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-molten text-base">
              <CheckIcon className="h-2.5 w-2.5" />
            </span>
            Selected
          </p>
          <dl className="divide-y divide-line overflow-hidden rounded border border-line bg-panel">
            <Spec k="Area" v={formatArea(sqmToSqft(d.areaSqM), 'sqft')} accent />
            <Spec k="Type" v="Traced plan" />
            <Spec k="Columns" v={`${d.columnCount} ${trace.geometry.columnsInferred ? '(inferred grid)' : '(placed)'}`} />
            <Spec k="Layout factor" v="× 1.00 (measured)" />
          </dl>
          <p className="text-[11px] leading-relaxed text-dim">
            Column, beam and slab steel are computed from this measured layout instead of a flat
            rate. Press Next to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Blocks progress on purpose: the entered footprint and the traced one
 *  disagree by more than the app's own "meaningfully different" threshold
 *  (see PLAN_AREA_MISMATCH_THRESHOLD), so which one is right is a decision
 *  only the person who measured them can make — guessing either way would be
 *  silently wrong for someone. Whichever is picked becomes the footprint used
 *  for footings, the staircase/misc allowance and every area check on step 1;
 *  columns, beams and slabs already come from the traced layout regardless. */
function AreaConfirmDialog({ enteredSqFt, tracedSqFt, unit, onKeepEntered, onUseTraced }) {
  const enteredDisplay = formatArea(convertArea(enteredSqFt, 'sqft', unit), unit);
  const tracedDisplay = formatArea(convertArea(tracedSqFt, 'sqft', unit), unit);
  const deviationPct = enteredSqFt ? Math.abs(tracedSqFt - enteredSqFt) / enteredSqFt : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-line bg-panel p-5 shadow-forge">
        <p className="label-eyebrow">Which area is right?</p>
        <h3 className="mt-1 text-base text-ink">
          Your traced plan is {formatNumber(deviationPct * 100, 0)}% away from what you entered
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-dim">
          Pick the number that actually matches the building — it becomes the footprint used for
          footings and the overall total. Columns, beams and slabs already come from the traced
          layout either way.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onKeepEntered}
            className="tile flex items-center justify-between gap-3 !p-3 text-left"
          >
            <span>
              <span className="block font-mono text-[10px] text-dim">What I entered</span>
              <span className="block text-sm text-ink">{enteredDisplay}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onUseTraced}
            className="tile flex items-center justify-between gap-3 !p-3 text-left"
          >
            <span>
              <span className="block font-mono text-[10px] text-dim">The traced measurement</span>
              <span className="block text-sm text-ink">{tracedDisplay}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
