import { Tile, StepHeading } from '../ui/Primitives.jsx';
import { FLOOR_OPTIONS } from '../../data/assumptions.js';

/** A house drawn with `levels` storeys, so the three tiles differ visually
 *  rather than all sharing one generic icon. */
function HouseIcon({ levels }) {
  const floorH = 16;
  const bodyH = floorH * levels;
  const top = 58 - bodyH;

  return (
    <svg viewBox="0 0 72 64" className="h-16 w-full" role="img" aria-hidden="true">
      <rect x="18" y={top} width="36" height={bodyH} rx="1.5" fill="#FFFFFF" stroke="#414042" strokeWidth="2" />
      <path d={`M14 ${top} L36 ${top - 11} L58 ${top} Z`} fill="#F5821E" opacity="0.9" />
      {Array.from({ length: levels }, (_, i) => {
        const y = top + i * floorH;
        return (
          <g key={i}>
            {i > 0 && <path d={`M18 ${y}h36`} stroke="#6D6E71" strokeWidth="1" />}
            <rect x="23" y={y + 4.5} width="8" height="7" fill="#5AAA46" opacity="0.35" stroke="#6D6E71" strokeWidth="0.8" />
            <rect x="41" y={y + 4.5} width="8" height="7" fill="#5AAA46" opacity="0.35" stroke="#6D6E71" strokeWidth="0.8" />
          </g>
        );
      })}
      <rect x="32" y="48" width="8" height="10" fill="#414042" opacity="0.15" stroke="#414042" strokeWidth="1" />
      <path d="M4 58h64" stroke="#414042" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function StepFloors({ state, dispatch }) {
  return (
    <div className="px-4 py-8 sm:px-8">
      <StepHeading
        title="Select the number of floors"
        sub="Footings are poured once; columns, beams and slabs are counted for every level."
      />

      <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
        {FLOOR_OPTIONS.map((f) => (
          <Tile
            key={f.id}
            selected={state.floors === f.id}
            onClick={() => dispatch({ type: 'setFloors', value: f.id })}
            className="flex flex-col items-center gap-3 text-center"
          >
            <HouseIcon levels={f.levels} />
            <div>
              <div className="text-base font-semibold text-charcoal">{f.label}</div>
              <div className="mt-0.5 text-xs text-grey">{f.blurb}</div>
            </div>
          </Tile>
        ))}
      </div>
    </div>
  );
}
