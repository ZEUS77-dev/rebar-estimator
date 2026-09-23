import { useMemo } from 'react';
import { Tile, Chip, StepHeading, CheckIcon } from '../ui/Primitives.jsx';
import FloorPlanSvg from '../plans/FloorPlanSvg.jsx';
import { FLOOR_PLANS, BHK_FILTERS, PLANS_BY_ID } from '../../data/floorPlans.js';
import { formatNumber } from '../../lib/units.js';

export default function StepPlan({ state, dispatch }) {
  const plans = useMemo(
    () => (state.bhkFilter ? FLOOR_PLANS.filter((p) => p.bhk === state.bhkFilter) : FLOOR_PLANS),
    [state.bhkFilter],
  );
  const selected = state.planId ? PLANS_BY_ID[state.planId] : null;

  return (
    <div className="px-4 py-8 sm:px-8">
      <StepHeading
        title="Select a floor plan similar to your home design"
        sub="The plan sets the layout complexity factor. Your entered area is still what drives the quantity."
      />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
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
            className="ml-1 text-xs font-medium text-grey underline underline-offset-4 hover:text-primary"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* auto-rows-max: without it the max-height squeezes the auto-sized rows
            and every card clips its own contents instead of the list scrolling. */}
        <div className="grid max-h-[26rem] auto-rows-max gap-4 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <Tile
              key={p.id}
              as="div"
              selected={state.planId === p.id}
              onClick={() => dispatch({ type: 'setPlan', value: p.id })}
              className="flex flex-col !p-0 overflow-hidden"
            >
              <div className="h-40 shrink-0 bg-white p-2">
                <FloorPlanSvg plan={p} compact />
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 border-t border-grey/15 bg-grey-light px-3 py-2.5 text-left">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-primary">Area</div>
                  <div className="text-sm font-semibold text-navy">
                    {formatNumber(p.areaSqFt, 2)} sqft
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-primary">Type</div>
                  <div className="text-sm font-semibold text-navy">{p.type}</div>
                </div>
              </div>
            </Tile>
          ))}
          {!plans.length && (
            <p className="col-span-full py-10 text-center text-sm text-grey">
              No plans for this filter.
            </p>
          )}
        </div>

        <aside className="card h-fit p-5">
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-semibold text-navy">{selected.name} selected</span>
              </div>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-primary">Area</dt>
                  <dd className="text-lg font-semibold text-navy">
                    {formatNumber(selected.areaSqFt, 2)} sq ft
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-primary">Type</dt>
                  <dd className="text-lg font-semibold text-navy">{selected.type}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-primary">Rooms</dt>
                  <dd className="text-sm text-grey">
                    {selected.bedrooms} bedrooms · {selected.bathrooms} baths
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-grey">
              Pick the plan closest to your layout. You can skip this — the estimate then assumes a
              simple rectangular layout.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
