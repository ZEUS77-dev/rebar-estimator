/** The Plan Studio's SVG canvas: the uploaded photo as a backdrop, plus
 *  whatever the current stage is drawing on top of it - the scale line, the
 *  traced outline, placed/inferred columns and the structural grid.
 *
 *  One code path for mouse, touch and pen throughout (Pointer Events via
 *  useSvgViewport). A press only PLACES something if it never moved past the
 *  pan threshold - that is what lets the same canvas support "drag to pan"
 *  and "tap to place a point" without a mode switch. Marker/snap sizes are
 *  fractions of the CURRENT viewBox width rather than a fixed pixel count, so
 *  they read the same on screen whether the user is zoomed in or out. */

import { useMemo } from 'react';
import { useSvgViewport } from '../../hooks/useSvgViewport.js';
import { geometryToImageTransform, toImagePx } from './geometryOverlay.js';

const PLACEABLE_STAGES = new Set(['scale', 'outline', 'columns']);

export default function StudioCanvas({ image, stage, doc, geometry, dispatch }) {
  const viewport = useSvgViewport(image.w, image.h);
  const { outline, columns: placedColumns, scale } = doc;

  const [, , viewW] = viewport.viewBox.split(' ').map(Number);
  const markerR = viewW * 0.006;
  const snapRadius = viewW * 0.02;

  const transform = useMemo(
    () => geometryToImageTransform(scale, outline.points),
    [scale, outline.points],
  );

  const gridLines = useMemo(() => {
    if (!geometry || !transform) return { vertical: [], horizontal: [] };
    const ys = geometry.grid.ys;
    const xs = geometry.grid.xs;
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const vertical = xs.map((x) => [toImagePx([x, yMin], transform), toImagePx([x, yMax], transform)]);
    const horizontal = ys.map((y) => [toImagePx([xMin, y], transform), toImagePx([xMax, y], transform)]);
    return { vertical, horizontal };
  }, [geometry, transform]);

  const inferredColumnsPx = useMemo(() => {
    if (!geometry || !transform || !geometry.columnsInferred) return [];
    return geometry.columns.map((c) => toImagePx(c, transform));
  }, [geometry, transform]);

  const handlePointerUp = (e) => {
    viewport.handlers.onPointerUp(e);
    if (!PLACEABLE_STAGES.has(stage) || !viewport.wasTap()) return;
    const pt = viewport.toImagePoint(e.clientX, e.clientY);
    if (!pt) return;

    if (stage === 'scale') {
      dispatch({ type: 'setScalePoint', value: [pt.x, pt.y] });
      return;
    }
    if (stage === 'outline') {
      if (outline.closed) return;
      if (outline.points.length >= 3) {
        const [fx, fy] = outline.points[0];
        if (Math.hypot(pt.x - fx, pt.y - fy) <= snapRadius) {
          dispatch({ type: 'closeOutline' });
          return;
        }
      }
      dispatch({ type: 'addOutlinePoint', value: [pt.x, pt.y] });
      return;
    }
    if (stage === 'columns') {
      dispatch({ type: 'addColumn', value: { x: pt.x, y: pt.y } });
    }
  };

  return (
    <svg
      ref={viewport.svgRef}
      viewBox={viewport.viewBox}
      className="h-full w-full touch-none select-none bg-base"
      onPointerDown={viewport.handlers.onPointerDown}
      onPointerMove={viewport.handlers.onPointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={viewport.handlers.onPointerCancel}
      onWheel={viewport.handlers.onWheel}
    >
      <image href={image.url} x={0} y={0} width={image.w} height={image.h} preserveAspectRatio="none" />

      {/* --- structural grid preview, once a scale + outline compile ----- */}
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
          vectorEffect="non-scaling-stroke"
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
          vectorEffect="non-scaling-stroke"
          opacity={0.55}
        />
      ))}

      {/* --- scale reference line ---------------------------------------- */}
      {scale?.a && (
        <>
          {scale.b && (
            <line
              x1={scale.a[0]}
              y1={scale.a[1]}
              x2={scale.b[0]}
              y2={scale.b[1]}
              stroke="rgb(var(--c-molten))"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
          <circle cx={scale.a[0]} cy={scale.a[1]} r={markerR} fill="rgb(var(--c-molten))" />
          {scale.b && <circle cx={scale.b[0]} cy={scale.b[1]} r={markerR} fill="rgb(var(--c-molten))" />}
        </>
      )}

      {/* --- traced outline ------------------------------------------------ */}
      {outline.points.length > 0 && (
        <polyline
          points={outline.points.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="rgb(var(--c-molten))"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {outline.closed && outline.points.length >= 3 && (
        <line
          x1={outline.points[outline.points.length - 1][0]}
          y1={outline.points[outline.points.length - 1][1]}
          x2={outline.points[0][0]}
          y2={outline.points[0][1]}
          stroke="rgb(var(--c-molten))"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {outline.points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 0 && !outline.closed ? markerR * 1.6 : markerR}
          fill={i === 0 ? 'rgb(var(--c-panel))' : 'rgb(var(--c-molten))'}
          stroke="rgb(var(--c-molten))"
          strokeWidth={i === 0 ? 2 : 0}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* --- columns: inferred (hollow) then the user's own clicks (solid) */}
      {inferredColumnsPx.map(([x, y], i) => (
        <circle
          key={`inf${i}`}
          cx={x}
          cy={y}
          r={markerR * 1.1}
          fill="none"
          stroke="rgb(var(--c-verdigris))"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          opacity={0.85}
        />
      ))}
      {placedColumns.map((c, i) => (
        <circle key={`col${i}`} cx={c.x} cy={c.y} r={markerR} fill="rgb(var(--c-verdigris))" />
      ))}
    </svg>
  );
}
