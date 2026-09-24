/** Read-only rendering of a finished trace: the uploaded photo with the
 *  outline, grid and columns drawn over it, exactly as compiled. Used on
 *  step 3's detail pane so "traced" reads as the actual drawing, not just a
 *  row of numbers - the same reason the gallery branch draws the plan rather
 *  than only listing its area.
 *
 *  No pan/zoom, no pointer handling: this is a static thumbnail, sized to
 *  whatever box it's given via `preserveAspectRatio="xMidYMid meet"` so the
 *  photo is never distorted (unlike the Studio's own live canvas, which
 *  intentionally stretches to fill an arbitrary pan/zoom window). */

import { useMemo } from 'react';
import { geometryToImageTransform, toImagePx } from './geometryOverlay.js';

export default function TracePreview({ preview, geometry, className = '' }) {
  const { imageUrl, imageW, imageH, outline, columns: placedColumns, scale } = preview;

  const markerR = Math.max(imageW, imageH) * 0.006;

  const transform = useMemo(() => geometryToImageTransform(scale, outline), [scale, outline]);

  const gridLines = useMemo(() => {
    if (!geometry || !transform) return { vertical: [], horizontal: [] };
    const { xs, ys } = geometry.grid;
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    return {
      vertical: xs.map((x) => [toImagePx([x, yMin], transform), toImagePx([x, yMax], transform)]),
      horizontal: ys.map((y) => [toImagePx([xMin, y], transform), toImagePx([xMax, y], transform)]),
    };
  }, [geometry, transform]);

  const inferredColumnsPx = useMemo(() => {
    if (!geometry || !transform || !geometry.columnsInferred) return [];
    return geometry.columns.map((c) => toImagePx(c, transform));
  }, [geometry, transform]);

  return (
    <svg
      viewBox={`0 0 ${imageW} ${imageH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label="Traced floor plan"
    >
      <image href={imageUrl} x={0} y={0} width={imageW} height={imageH} preserveAspectRatio="none" />

      {gridLines.vertical.map(([a, b], i) => (
        <line
          key={`v${i}`}
          x1={a[0]}
          y1={a[1]}
          x2={b[0]}
          y2={b[1]}
          stroke="rgb(var(--c-verdigris))"
          strokeDasharray="6 6"
          strokeWidth={1.5}
          opacity={0.55}
        />
      ))}
      {gridLines.horizontal.map(([a, b], i) => (
        <line
          key={`h${i}`}
          x1={a[0]}
          y1={a[1]}
          x2={b[0]}
          y2={b[1]}
          stroke="rgb(var(--c-verdigris))"
          strokeDasharray="6 6"
          strokeWidth={1.5}
          opacity={0.55}
        />
      ))}

      {outline.length > 0 && (
        <polygon
          points={outline.map((p) => p.join(',')).join(' ')}
          fill="rgb(var(--c-molten) / 0.06)"
          stroke="rgb(var(--c-molten))"
          strokeWidth={2.5}
        />
      )}

      {inferredColumnsPx.map(([x, y], i) => (
        <circle
          key={`inf${i}`}
          cx={x}
          cy={y}
          r={markerR * 1.1}
          fill="none"
          stroke="rgb(var(--c-verdigris))"
          strokeWidth={2}
          opacity={0.85}
        />
      ))}
      {placedColumns.map((c, i) => (
        <circle key={`col${i}`} cx={c.x} cy={c.y} r={markerR} fill="rgb(var(--c-verdigris))" />
      ))}
    </svg>
  );
}
