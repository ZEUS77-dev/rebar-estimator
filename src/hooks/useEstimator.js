/** Wizard state plus the memoised engine call.
 *
 *  Answers survive back-navigation; the estimate is only computed once the
 *  wizard reaches the result step. Rate edits go through recost() so a
 *  keystroke never re-runs the full estimate. */

import { useEffect, useMemo, useReducer, useRef } from 'react';
import { estimate, recost } from '../lib/estimator.js';
import { DEFAULT_ASSUMPTIONS, DEFAULT_BUILDING_TYPE, withBuildingType } from '../data/assumptions.js';
import { PLANS_BY_ID } from '../data/floorPlans.js';
import { convertArea, round, sqmToSqft } from '../lib/units.js';
import { clampRate } from '../lib/validation.js';

export const STEPS = [
  { n: 1, key: 'area', label: 'Floor Area' },
  { n: 2, key: 'floors', label: 'Select Floors' },
  { n: 3, key: 'plan', label: 'Choose Floor Plan' },
  { n: 4, key: 'scope', label: 'Estimate Type' },
];

export const RESULT_STEP = 5;

const initialState = {
  step: 1,
  area: '',
  unit: 'sqft',
  floors: 'G+1',
  planId: null,
  bhkFilter: null,
  scope: 'full',
  rate: null, // null = use the per-grade default rates
  grade: null, // null = per-element defaults
  buildingType: DEFAULT_BUILDING_TYPE, // 'villa' | 'apartment' - widens the recommended area band only

  // Which plan source step 3 is currently using. A trace is kept around even
  // when planSource switches back to 'gallery' - re-tracing is the expensive
  // part, not remembering a compiled result, so picking a gallery plan and
  // then coming back to "my traced plan" is free.
  planSource: 'gallery', // 'gallery' | 'traced'
  trace: null, // { id, geometry } - geometry only, never the source image
};

function reducer(state, action) {
  switch (action.type) {
    case 'next':
      return { ...state, step: Math.min(state.step + 1, RESULT_STEP) };
    case 'back':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'goto':
      return { ...state, step: action.step };
    case 'restart':
      return { ...initialState };

    case 'setArea':
      return { ...state, area: action.value };

    case 'setUnit': {
      // Convert what is already typed rather than clearing it.
      if (action.value === state.unit) return state;
      const converted =
        state.area === '' ? '' : String(round(convertArea(state.area, state.unit, action.value), 2));
      return { ...state, unit: action.value, area: converted };
    }

    case 'setFloors':
      return { ...state, floors: action.value };
    case 'setPlan':
      return { ...state, planId: action.value, planSource: 'gallery' };
    case 'setTrace':
      return { ...state, trace: action.value, planSource: 'traced' };
    case 'clearTrace':
      return {
        ...state,
        trace: null,
        planSource: state.planSource === 'traced' ? 'gallery' : state.planSource,
      };
    case 'setPlanSource':
      return { ...state, planSource: action.value };
    case 'setBhkFilter':
      return { ...state, bhkFilter: state.bhkFilter === action.value ? null : action.value };
    case 'setScope':
      return { ...state, scope: action.value };
    case 'setRate':
      return { ...state, rate: action.value };
    case 'setGrade':
      return { ...state, grade: action.value };
    case 'setBuildingType':
      return { ...state, buildingType: action.value };

    default:
      return state;
  }
}

export function useEstimator(baseAssumptions = DEFAULT_ASSUMPTIONS) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // The one thing a building-type preset changes: which area counts as
  // typical (see withBuildingType). Every rate and factor underneath is the
  // same object either way - it's the same engine, not a second one. This is
  // the assumptions object every consumer should use from here on, in place
  // of the raw one passed in.
  const assumptions = useMemo(
    () => withBuildingType(baseAssumptions, state.buildingType),
    [baseAssumptions, state.buildingType],
  );

  // Plan Studio hands its object URL out to us at the moment a trace is
  // finished (see usePlanTrace's own comment on why it doesn't revoke it
  // itself). This wizard's `trace` state is that URL's owner from here on:
  // revoke the previous one whenever it's replaced or cleared, so re-tracing
  // or starting over doesn't leak a blob per attempt.
  const prevPreviewUrlRef = useRef(null);
  useEffect(() => {
    const url = state.trace?.preview?.imageUrl ?? null;
    if (prevPreviewUrlRef.current && prevPreviewUrlRef.current !== url) {
      URL.revokeObjectURL(prevPreviewUrlRef.current);
    }
    prevPreviewUrlRef.current = url;
  }, [state.trace]);

  // A traced plan synthesises the same plan-shaped object the gallery already
  // produces - areaSqFt from the compiled geometry, planFactor pinned to 1
  // since a traced layout is measured, not estimated from a BHK count. Every
  // existing consumer (validateInput, elementKg, the result screen) keeps
  // reading the same fields it always has; only estimate() itself also gets
  // the geometry directly, via buildingGeometry below.
  const trace = state.planSource === 'traced' ? state.trace : null;
  const plan = trace
    ? {
        id: trace.id,
        // result.input.planType feeds a "<type> plan" template on the result
        // screen (e.g. "2BHK plan") - "Traced" alone reads right there too.
        type: 'Traced',
        planFactor: 1,
        areaSqFt: sqmToSqft(trace.geometry.derived.areaSqM),
      }
    : state.planId
      ? PLANS_BY_ID[state.planId]
      : null;
  const buildingGeometry = trace ? trace.geometry : null;

  // Only the four wizard answers feed this. Rate edits are handled below.
  const baseResult = useMemo(() => {
    if (state.step < RESULT_STEP) return null;
    return estimate({
      areaSqFt: state.area,
      areaUnit: state.unit,
      floors: state.floors,
      plan,
      scope: state.scope,
      assumptions,
      overrides: state.grade ? { grade: state.grade } : {},
      buildingGeometry,
    });
  }, [
    state.step,
    state.area,
    state.unit,
    state.floors,
    state.scope,
    state.grade,
    assumptions,
    plan,
    buildingGeometry,
  ]);

  const result = useMemo(() => {
    if (!baseResult || !baseResult.ok) return baseResult;
    if (state.rate === null || state.rate === '') return baseResult;
    const clamped = clampRate(state.rate, assumptions);
    return clamped === null ? recost(baseResult, NaN) : recost(baseResult, clamped);
  }, [baseResult, state.rate, assumptions]);

  return { state, dispatch, plan, result, assumptions };
}
