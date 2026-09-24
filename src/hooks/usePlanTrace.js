/** Plan Studio state: the TraceDoc reducer, undo history, and the memoised
 *  compileGeometry() call that turns it into an engine-facing BuildingGeometry.
 *
 *  TraceDoc lives entirely in image pixels and never reaches the engine - see
 *  geometry/compile.js's module doc for the two-object split this mirrors.
 *  `stage` drives which part of the Studio flow is showing; it is UI
 *  navigation, not part of the document a compile cares about. */

import { useReducer, useMemo, useRef, useEffect, useCallback } from 'react';
import { compileGeometry } from '../lib/geometry/compile.js';

export const STUDIO_STAGES = ['upload', 'scale', 'outline', 'columns', 'storey', 'done'];

const DEFAULT_TARGET_SPAN_M = 3.6;
const DEFAULT_STOREY_HEIGHT_M = 3.0;

const emptyDoc = () => ({
  image: null, // { url, name, w, h }
  scale: null, // { a: [x,y]|null, b: [x,y]|null, value: string, unit: 'm'|'ft' }
  outline: { points: [], closed: false },
  columns: [], // [{ x, y }]
  grid: { targetSpanM: DEFAULT_TARGET_SPAN_M },
  storey: { heightM: DEFAULT_STOREY_HEIGHT_M },
});

const initialState = {
  stage: 'upload',
  doc: emptyDoc(),
  history: [],
};

const HISTORY_LIMIT = 50;

function snapshot(state) {
  return [...state.history, state.doc].slice(-HISTORY_LIMIT);
}

function reducer(state, action) {
  switch (action.type) {
    case 'setImage':
      return { stage: 'scale', doc: { ...emptyDoc(), image: action.value }, history: [] };

    case 'setScalePoint': {
      const scale = state.doc.scale || { a: null, b: null, value: '', unit: 'm' };
      const next = scale.a === null ? { ...scale, a: action.value, b: null } : { ...scale, b: action.value };
      return { ...state, history: snapshot(state), doc: { ...state.doc, scale: next } };
    }
    case 'clearScalePoints':
      return {
        ...state,
        doc: { ...state.doc, scale: { ...state.doc.scale, a: null, b: null } },
      };
    case 'setScaleValue':
      return { ...state, doc: { ...state.doc, scale: { ...state.doc.scale, value: action.value } } };
    case 'setScaleUnit':
      return { ...state, doc: { ...state.doc, scale: { ...state.doc.scale, unit: action.value } } };
    case 'confirmScale':
      return { ...state, stage: 'outline' };

    case 'addOutlinePoint': {
      if (state.doc.outline.closed) return state;
      return {
        ...state,
        history: snapshot(state),
        doc: {
          ...state.doc,
          outline: { ...state.doc.outline, points: [...state.doc.outline.points, action.value] },
        },
      };
    }
    case 'closeOutline':
      if (state.doc.outline.points.length < 3) return state;
      return {
        ...state,
        history: snapshot(state),
        doc: { ...state.doc, outline: { ...state.doc.outline, closed: true } },
      };
    case 'confirmOutline':
      if (!state.doc.outline.closed) return state;
      return { ...state, stage: 'columns' };

    case 'addColumn':
      return {
        ...state,
        history: snapshot(state),
        doc: { ...state.doc, columns: [...state.doc.columns, action.value] },
      };
    case 'confirmColumns':
      return { ...state, stage: 'storey' };

    case 'setStoreyHeight':
      return { ...state, doc: { ...state.doc, storey: { heightM: action.value } } };
    case 'confirmStorey':
      return { ...state, stage: 'done' };

    case 'undo': {
      if (!state.history.length) return state;
      const doc = state.history[state.history.length - 1];
      return { ...state, doc, history: state.history.slice(0, -1) };
    }
    case 'goToStage':
      return { ...state, stage: action.value };
    case 'reset':
      return { stage: 'upload', doc: emptyDoc(), history: [] };

    default:
      return state;
  }
}

/** Builds the plain object geometry/compile.js expects, or null while a scale
 *  hasn't been fully drawn yet - there is nothing to compile before that. */
function toCompileInput(doc) {
  const { scale, outline, columns, grid, storey, image } = doc;
  if (!scale || scale.a == null || scale.b == null) return null;
  const value = Number(scale.value);
  if (!Number.isFinite(value) || value <= 0) return null;
  return {
    scale: { a: scale.a, b: scale.b, value, unit: scale.unit },
    outline: { points: outline.points },
    columns,
    grid,
    storey,
    image: image ? { w: image.w, h: image.h } : undefined,
  };
}

export function usePlanTrace() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const compileInput = useMemo(() => toCompileInput(state.doc), [state.doc]);
  const geometry = useMemo(
    () => (compileInput ? compileGeometry(compileInput) : null),
    [compileInput],
  );

  // Revoke the previous object URL whenever the image changes, and on
  // unmount - otherwise every re-upload during a Studio session leaks one.
  const urlRef = useRef(null);
  useEffect(() => {
    const url = state.doc.image?.url ?? null;
    if (urlRef.current && urlRef.current !== url) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
  }, [state.doc.image]);
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const loadImageFile = useCallback((file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      dispatch({
        type: 'setImage',
        value: { url, name: file.name, w: img.naturalWidth, h: img.naturalHeight },
      });
    };
    img.src = url;
  }, []);

  return {
    state,
    dispatch,
    geometry,
    canUndo: state.history.length > 0,
    loadImageFile,
  };
}
