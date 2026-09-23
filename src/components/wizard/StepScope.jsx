import { Tile } from '../ui/Primitives.jsx';
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
    <div className="stagger px-4 py-6 sm:px-8">
      {/* Title left, grade selector right — the same one-row header step 3 uses,
          so the two steps sit at the same height. */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3" style={{ '--i': 0 }}>
        <div className="min-w-0">
          <p className="label-eyebrow">Step 4</p>
          <h2 className="mt-1 text-lg text-ink sm:text-xl">
            What should we estimate rebar for?
          </h2>
        </div>
      </div>

      {/* Five across on a wide screen: one row instead of two. */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" style={{ '--i': 1 }}>
        {SCOPES.map((s) => (
          <Tile
            key={s.id}
            selected={state.scope === s.id}
            onClick={() => dispatch({ type: 'setScope', value: s.id })}
            className="!p-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-molten/10 text-molten">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                {ART[s.id]}
              </svg>
            </span>
            <div className="mt-2 text-sm font-semibold text-ink">{s.label}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-dim">{s.blurb}</div>
          </Tile>
        ))}
      </div>

      <div className="mt-4 rounded border border-line bg-panel p-4" style={{ '--i': 2 }}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-mono text-[11px] text-ink">TMT grade</h3>
          <p className="text-[11px] text-dim">
            Optional — grade changes the rate, never the weight.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
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
        {/* The chosen grade's note, rather than a paragraph explaining all nine. */}
        <p className="mt-2 text-[11px] text-dim">
          {state.grade
            ? GRADES.find((g) => g.id === state.grade)?.note
            : 'A615 Gr-60 throughout — the standard residential grade.'}
        </p>
      </div>
    </div>
  );
}
