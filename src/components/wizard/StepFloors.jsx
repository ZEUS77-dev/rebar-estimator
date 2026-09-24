import { Tile, StepHeading } from '../ui/Primitives.jsx';
import { FLOOR_OPTIONS } from '../../data/assumptions.js';

/** Theme-aware: colours come from the CSS variables, so the icon is legible on
 *  both grounds.
 *
 *  Two drawing modes, chosen purely by storey count:
 *
 *  - G/G+1/G+2 (levels <= 3): the original one-rect-per-floor silhouette,
 *    pixel-identical to before.
 *  - G+3 and up: a fixed-geometry massing block instead. The original approach
 *    scaled the body height by `levels`, which clips the roof clean off the
 *    top of the viewBox once you go past three storeys - that was the actual
 *    bug blocking taller options, not just a validation gate. Rather than
 *    trying to cram eleven floor-lines into the same 64-unit icon, the massing
 *    block stays a constant size (so it can never clip, at any storey count)
 *    and carries the real number as a bold badge instead of a literal count of
 *    drawn floors. */
function HouseIcon({ levels, storeyLabel }) {
  if (levels <= 3) {
    const floorH = 15;
    const bodyH = floorH * levels;
    const top = 58 - bodyH;

    return (
      <svg viewBox="0 0 72 64" className="h-16 w-full" role="img" aria-hidden="true">
        <rect
          x="18"
          y={top}
          width="36"
          height={bodyH}
          rx="1"
          fill="rgb(var(--c-raised))"
          stroke="rgb(var(--c-line))"
          strokeWidth="1.4"
        />
        <path
          d={`M14 ${top} L36 ${top - 10} L58 ${top} Z`}
          fill="none"
          stroke="rgb(var(--c-molten))"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {Array.from({ length: levels }, (_, i) => {
          const y = top + i * floorH;
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

  const BODY_TOP = 10;
  const BODY_H = 48; // bottom lands at 58, the same ground line as the low-rise icon
  const ROWS = [0, 1, 2, 3]; // fixed - decorative texture, not a literal floor count

  return (
    <svg viewBox="0 0 72 64" className="h-16 w-full" role="img" aria-hidden="true">
      <rect
        x="16"
        y={BODY_TOP}
        width="40"
        height={BODY_H}
        rx="1.5"
        fill="rgb(var(--c-raised))"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.4"
      />
      <path
        d={`M12 ${BODY_TOP} L36 0 L60 ${BODY_TOP} Z`}
        fill="none"
        stroke="rgb(var(--c-molten))"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {ROWS.map((i) => (
        <g key={i}>
          <rect x="22" y={BODY_TOP + 5 + i * 10} width="7" height="6" fill="rgb(var(--c-molten))" opacity="0.22" />
          <rect x="43" y={BODY_TOP + 5 + i * 10} width="7" height="6" fill="rgb(var(--c-molten))" opacity="0.22" />
        </g>
      ))}
      {/* The real storey count, since the windows above no longer count it. */}
      <text
        x="36"
        y={BODY_TOP + BODY_H / 2 + 4}
        textAnchor="middle"
        fontFamily="'Martian Mono', monospace"
        fontSize="12"
        fontWeight="700"
        fill="rgb(var(--c-molten))"
      >
        {storeyLabel}
      </text>
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

      {/* Wraps rather than scrolls - eleven options at up to six per row stays
          within a couple of extra rows on any screen, which reads better than
          a horizontal scroller for a one-tap choice. */}
      <div className="mx-auto mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {FLOOR_OPTIONS.map((f) => (
          <Tile
            key={f.id}
            selected={state.floors === f.id}
            onClick={() => dispatch({ type: 'setFloors', value: f.id })}
            className="!p-3 flex flex-col items-center gap-2 text-center"
          >
            <HouseIcon levels={f.levels} storeyLabel={f.id} />
            <div>
              <div className="text-sm font-semibold text-ink">{f.label}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-dim">{f.blurb}</div>
            </div>
          </Tile>
        ))}
      </div>
    </div>
  );
}
