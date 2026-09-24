/** Pan, zoom and screen<->image-pixel conversion for the Plan Studio canvas.
 *
 *  One code path for mouse, touch and pen: Pointer Events throughout, no
 *  separate touch handlers. The SVG's own viewBox IS the pannable/zoomable
 *  window into image space (always in image pixels, 1 unit = 1 px), so
 *  converting a click to an image coordinate is just asking the browser for
 *  its screen CTM - it already accounts for the current pan/zoom and however
 *  CSS has laid the element out, with no matrix maths of our own to get
 *  wrong. */

import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_RELATIVE_SCALE = 0.15; // most zoomed OUT: can see ~6.7x the fitted view
const MAX_RELATIVE_SCALE = 8; // most zoomed IN
const PAN_THRESHOLD_PX = 6; // screen px of movement before a press counts as a drag, not a tap

function fitView(w, h) {
  const W = w || 100;
  const H = h || 100;
  return { x: 0, y: 0, w: W, h: H };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Clamps a proposed `view.w x view.h` resize so zoom never runs away in
 *  either direction, and returns the FACTOR that actually gets applied. */
function clampZoomFactor(factor, view, naturalW, naturalH) {
  const fit = fitView(naturalW, naturalH);
  const minW = fit.w / MAX_RELATIVE_SCALE;
  const maxW = fit.w / MIN_RELATIVE_SCALE;
  const desiredW = view.w * factor;
  const clampedW = Math.min(maxW, Math.max(minW, desiredW));
  return clampedW / view.w;
}

export function useSvgViewport(naturalWidth, naturalHeight) {
  const svgRef = useRef(null);
  const [view, setView] = useState(() => fitView(naturalWidth, naturalHeight));
  const pointers = useRef(new Map()); // pointerId -> screen {x,y}
  const gesture = useRef(null);
  const movedRef = useRef(false);

  // Re-fit once the image's real dimensions arrive (upload replaces a 0x0
  // placeholder), and whenever a fresh image is loaded.
  useEffect(() => {
    setView(fitView(naturalWidth, naturalHeight));
  }, [naturalWidth, naturalHeight]);

  const toImagePoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      movedRef.current = false;
      if (pointers.current.size === 1) {
        gesture.current = { kind: 'pan', start: { x: e.clientX, y: e.clientY }, startView: view };
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        gesture.current = { kind: 'pinch', startDist: dist(a, b), startMid: midpoint(a, b), startView: view };
      }
    },
    [view],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture.current;
      if (!g) return;

      if (g.kind === 'pan' && pointers.current.size === 1) {
        const dx = e.clientX - g.start.x;
        const dy = e.clientY - g.start.y;
        if (Math.hypot(dx, dy) > PAN_THRESHOLD_PX) movedRef.current = true;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || !rect.width || !rect.height) return;
        const scaleX = g.startView.w / rect.width;
        const scaleY = g.startView.h / rect.height;
        setView({ ...g.startView, x: g.startView.x - dx * scaleX, y: g.startView.y - dy * scaleY });
      } else if (g.kind === 'pinch' && pointers.current.size === 2) {
        movedRef.current = true;
        const [a, b] = [...pointers.current.values()];
        const newDist = dist(a, b);
        if (newDist <= 0 || g.startDist <= 0) return;
        // Fingers spreading apart (newDist > startDist) should zoom IN, which
        // means SHRINKING the viewBox - hence the inverted ratio.
        const rawFactor = g.startDist / newDist;
        const factor = clampZoomFactor(rawFactor, g.startView, naturalWidth, naturalHeight);
        const anchor = toImagePoint(g.startMid.x, g.startMid.y) ?? {
          x: g.startView.x + g.startView.w / 2,
          y: g.startView.y + g.startView.h / 2,
        };
        setView({
          x: anchor.x - (anchor.x - g.startView.x) * factor,
          y: anchor.y - (anchor.y - g.startView.y) * factor,
          w: g.startView.w * factor,
          h: g.startView.h * factor,
        });
      }
    },
    [naturalWidth, naturalHeight, toImagePoint],
  );

  const endPointer = useCallback(
    (e) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size === 0) {
        gesture.current = null;
      } else if (pointers.current.size === 1) {
        // Dropped from a pinch to one finger - restart as a pan from here
        // rather than jumping back to whatever the pan's original anchor was.
        const [[, p]] = [...pointers.current.entries()];
        gesture.current = { kind: 'pan', start: { x: p.x, y: p.y }, startView: view };
      }
    },
    [view],
  );

  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      const anchor = toImagePoint(e.clientX, e.clientY);
      if (!anchor) return;
      const rawFactor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      setView((v) => {
        const factor = clampZoomFactor(rawFactor, v, naturalWidth, naturalHeight);
        return {
          x: anchor.x - (anchor.x - v.x) * factor,
          y: anchor.y - (anchor.y - v.y) * factor,
          w: v.w * factor,
          h: v.h * factor,
        };
      });
    },
    [naturalWidth, naturalHeight, toImagePoint],
  );

  const wasTap = useCallback(() => !movedRef.current, []);
  const resetView = useCallback(() => setView(fitView(naturalWidth, naturalHeight)), [naturalWidth, naturalHeight]);

  return {
    svgRef,
    viewBox: `${view.x} ${view.y} ${view.w} ${view.h}`,
    toImagePoint,
    wasTap,
    resetView,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onWheel,
    },
  };
}
