/** Draws a floor plan from its room rectangles.
 *
 *  The brief shipped no plan images, so each entry in floorPlans.js carries its
 *  rooms on a 0-100 grid and this renders them in the thin-line look of an
 *  architectural drawing. Labels are dropped automatically when a room is too
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
        fill="#131519"
        stroke="#F5821E"
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
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.022)' : 'rgba(255,255,255,0.05)'}
              stroke="#2C313A"
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
                fill="#8D95A1"
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
                fill="#5A6270"
              >
                {r.dim}
              </text>
            )}
          </g>
        );
      })}

      {/* entry mark on the bottom wall */}
      <path d="M46 100 A 6 6 0 0 1 54 100" fill="none" stroke="#F5821E" strokeWidth="1.1" />
    </svg>
  );
}
