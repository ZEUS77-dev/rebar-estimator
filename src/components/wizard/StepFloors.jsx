import { Tile, StepHeading } from '../ui/Primitives.jsx';
import { FLOOR_OPTIONS } from '../../data/assumptions.js';

/** A house drawn with `levels` storeys, so the three tiles differ visually
 *  rather than all sharing one generic icon. */
/** Theme-aware: colours come from the CSS variables, so the icon is legible on
 *  both grounds. */
function HouseIcon({ levels }) {
  const floorH = 15;
  const bodyH = floorH * levels;
  const top = 58 - bodyH;

  return (
    <svg viewBox="0 0 72 64" className="h-16 w-full" role="img" aria-hidden="true">
      <rect x="18" y={top} width="36" height={bodyH} rx="1" fill="rgb(var(--c-raised))" stroke="rgb(var(--c-line))" strokeWidth="1.4" />
      <path d={`M14 ${top} L36 ${top - 10} L58 ${top} Z`} fill="none" stroke="rgb(var(--c-molten))" strokeWidth="1.6" strokeLinejoin="round" />
      {Array.from({ length: levels }, (_, i) => {
        const y = top + i * floorH;
        // The slab line between storeys is the thing that repeats per level.
        return (
          <g key={i}>
            {i > 0 && <path d={`M18 ${y}h36`} stroke="rgb(var(--c-molten))" strokeWidth="1" opacity="0.5" />}
            <rect x="23" y={y + 4} width="7" height="6" fill="rgb(var(--c-molten))" opacity="0.22" />
            <rect x="42" y={y + 4} width="7" height="6" fill="rgb(var(--c-molten))" opacity="0.22" />
          </g>
        );
      })}
      {/* footing: poured once, whatever the storey count */}
      <path d="M22 58h28l-3 4H25z" fill="rgb(var(--c-verdigris))" opacity="0.5" />
      <path d="M6 62h60" stroke="rgb(var(--c-line))" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function StepFloors({ state, dispatch }) {
  return (
    <div className="px-4 py-6 sm:px-8">
      <StepHeading
        title="Select the number of floors"
        sub="Footings are poured once; columns, beams and slabs are counted for every level."
      />

      <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-3">
        {FLOOR_OPTIONS.map((f) => (
          <Tile
            key={f.id}
            selected={state.floors === f.id}
            onClick={() => dispatch({ type: 'setFloors', value: f.id })}
            className="flex flex-col items-center gap-3 text-center"
          >
            <HouseIcon levels={f.levels} />
            <div>
              <div className="text-base font-semibold text-ink">{f.label}</div>
              <div className="mt-0.5 text-xs text-dim">{f.blurb}</div>
            </div>
          </Tile>
        ))}
      </div>
    </div>
  );
}
