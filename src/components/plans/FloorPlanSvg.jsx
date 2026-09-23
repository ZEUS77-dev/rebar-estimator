/** Draws a floor plan from its room rectangles.
 *
 *  The brief shipped no plan images, so each entry in floorPlans.js carries its
 *  rooms on a 0-100 grid and this renders them in the thin-line look of an
 *  architectural drawing.
 *
 *  Every colour resolves through the theme variables rather than a literal hex,
 *  so the drawing follows the day/night switch instead of staying dark on the
 *  daylight ground. Labels are dropped automatically when a room is too
 *  small to hold them, which is what keeps the small gallery thumbnails legible. */

const VB = 100;

export default function FloorPlanSvg({ plan, compact = false, className = '' }) {
  const rooms = plan.rooms || [];

  return (
    <svg
      viewBox={`-2 -2 ${VB + 4} ${VB + 4}`}
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`${plan.type} floor plan, ${plan.areaSqFt} square feet`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* outer wall */}
      <rect
        x="0"
        y="0"
        width={VB}
        height={VB}
        fill="rgb(var(--c-panel))"
        stroke="rgb(var(--c-molten))"
        strokeWidth="1.2"
        rx="0.5"
      />

      {rooms.map((r, i) => {
        // A room needs room for its text; below these thresholds we just draw the box.
        const showLabel = r.w >= 14 && r.h >= 12;
        const showDim = Boolean(r.dim) && !compact && r.w >= 26 && r.h >= 20;
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const fontSize = compact ? 2.6 : 3.1;

        return (
          <g key={i}>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill={i % 2 === 0 ? 'rgb(var(--c-base))' : 'rgb(var(--c-raised))'}
              stroke="rgb(var(--c-line))"
              strokeWidth="0.7"
            />
            {showLabel && (
              <text
                x={cx}
                y={showDim ? cy - 1.4 : cy + 1}
                textAnchor="middle"
                fontSize={fontSize}
                fontFamily="'Martian Mono', monospace"
                fontWeight="500"
                fill="rgb(var(--c-dim))"
                letterSpacing="0"
              >
                {r.label}
              </text>
            )}
            {showDim && (
              <text
                x={cx}
                y={cy + 3.4}
                textAnchor="middle"
                fontSize={fontSize - 0.7}
                fontFamily="'Martian Mono', monospace"
                fill="rgb(var(--c-dim) / 0.85)"
              >
                {r.dim}
              </text>
            )}
          </g>
        );
      })}

      {/* entry mark on the bottom wall */}
      <path d="M46 100 A 6 6 0 0 1 54 100" fill="none" stroke="rgb(var(--c-molten))" strokeWidth="1.1" />
    </svg>
  );
}
