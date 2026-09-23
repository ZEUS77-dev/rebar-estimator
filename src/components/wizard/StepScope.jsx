import { Tile, StepHeading } from '../ui/Primitives.jsx';
import { SCOPES, GRADES } from '../../data/assumptions.js';

/** Small line drawings so each scope tile reads at a glance. */
const ART = {
  full: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 20V10l8-6 8 6v10" strokeLinejoin="round" />
      <path d="M4 14h16M10 20v-6h4v6" />
    </g>
  ),
  slab: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 9l9-4 9 4-9 4-9-4z" strokeLinejoin="round" />
      <path d="M3 9v4l9 4 9-4V9" strokeLinejoin="round" />
    </g>
  ),
  beam: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="9" width="18" height="6" rx="1" />
      <path d="M6 9V5m12 4V5M6 19v-4m12 4v-4" />
    </g>
  ),
  column: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="9" y="4" width="6" height="16" rx="1" />
      <path d="M5 4h14M5 20h14M9 9h6m-6 3h6m-6 3h6" />
    </g>
  ),
  footing: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 4v8m4-8v8" />
      <path d="M3 12h18l-2 7H5l-2-7z" strokeLinejoin="round" />
    </g>
  ),
};

export default function StepScope({ state, dispatch }) {
  return (
    <div className="px-4 py-8 sm:px-8">
      <StepHeading
        title="What do you want to calculate rebar estimate for?"
        sub="Pick Full House for a complete build, or a single element to price one pour."
      />

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCOPES.map((s) => (
          <Tile
            key={s.id}
            selected={state.scope === s.id}
            onClick={() => dispatch({ type: 'setScope', value: s.id })}
            className="flex items-start gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                {ART[s.id]}
              </svg>
            </span>
            <div>
              <div className="text-sm font-semibold text-charcoal">{s.label}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-grey">{s.blurb}</div>
            </div>
          </Tile>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-grey-light bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-charcoal">TMT grade</h3>
            <p className="mt-0.5 text-xs text-grey">
              Optional. Leave on <strong>Recommended</strong> to use A615 Gr-60 throughout, the
              standard residential grade. Grade changes the rate, never the weight.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'setGrade', value: null })}
            aria-pressed={state.grade === null}
            className={`chip ${state.grade === null ? 'chip-selected' : ''}`}
          >
            Recommended
          </button>
          {GRADES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => dispatch({ type: 'setGrade', value: g.id })}
              aria-pressed={state.grade === g.id}
              title={g.note}
              className={`chip ${state.grade === g.id ? 'chip-selected' : ''}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
