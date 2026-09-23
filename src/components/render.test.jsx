/** Render smoke tests.
 *
 *  Every screen is rendered to a string so a crash, a bad import or a null
 *  dereference fails the suite instead of only showing up in the browser. */

import { describe, it, expect } from 'vitest';
import { renderToString as rts } from 'react-dom/server';

/** React SSR inserts <!-- --> between adjacent text nodes; strip it so assertions
 *  can read the text the way a user sees it. */
const renderToString = (el) => rts(el).replace(/<!-- -->/g, '');

import App from '../App.jsx';
import StepArea from './wizard/StepArea.jsx';
import StepFloors from './wizard/StepFloors.jsx';
import StepPlan from './wizard/StepPlan.jsx';
import StepScope from './wizard/StepScope.jsx';
import ResultView from './result/ResultView.jsx';
import FloorPlanSvg from './plans/FloorPlanSvg.jsx';
import { Stepper } from './ui/Primitives.jsx';

import { estimate } from '../lib/estimator.js';
import { FLOOR_PLANS, PLANS_BY_ID } from '../data/floorPlans.js';
import { DEFAULT_ASSUMPTIONS, SCOPES } from '../data/assumptions.js';

const noop = () => {};
const state = {
  step: 1,
  area: '1356.25',
  unit: 'sqft',
  floors: 'G+1',
  planId: 'fp-05',
  bhkFilter: null,
  scope: 'full',
  rate: null,
  grade: null,
};

const result = estimate({
  areaSqFt: 1356.25,
  floors: 'G+1',
  plan: PLANS_BY_ID['fp-05'],
  scope: 'full',
});

describe('screens render', () => {
  it('renders the app shell (step 1)', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Rebar Estimator');
    expect(html).toContain('Ground floor area');
    expect(html).toContain('Enter the built footprint');
  });

  it('renders step 1', () => {
    const html = renderToString(
      <StepArea state={state} dispatch={noop} onNext={noop} assumptions={DEFAULT_ASSUMPTIONS} />,
    );
    expect(html).toContain('Negotiate confidently');
  });

  it('renders step 2 with all three floor options', () => {
    const html = renderToString(<StepFloors state={state} dispatch={noop} />);
    expect(html).toContain('Ground');
    expect(html).toContain('G+1');
    expect(html).toContain('G+2');
  });

  it('renders step 3 with the gallery and the selection panel', () => {
    const html = renderToString(<StepPlan state={state} dispatch={noop} />);
    expect(html).toContain('1,528.49');
    expect(html).toContain('2BHK');
    expect(html).toContain('Plan E selected');
  });

  it('renders step 3 filtered to 4BHK without emptying the gallery', () => {
    const html = renderToString(
      <StepPlan state={{ ...state, bhkFilter: 4, planId: null }} dispatch={noop} />,
    );
    expect(html).toContain('4BHK');
    expect(html).not.toContain('No plans for this filter');
  });

  it('renders step 4 with every scope', () => {
    const html = renderToString(<StepScope state={state} dispatch={noop} />);
    for (const s of SCOPES) expect(html).toContain(s.label);
  });

  it('renders every floor plan svg', () => {
    for (const p of FLOOR_PLANS) {
      const html = renderToString(<FloorPlanSvg plan={p} />);
      expect(html).toContain('<svg');
    }
  });

  it('renders the stepper at each step', () => {
    for (const n of [1, 2, 3, 4]) {
      expect(renderToString(<Stepper current={n} />)).toContain('Estimate Type');
    }
  });
});

describe('result screen renders', () => {
  it('shows tonnage, cost, diameters, elements and the disclaimer', () => {
    const html = renderToString(
      <ResultView
        result={result}
        state={{ ...state, step: 5 }}
        dispatch={noop}
        onBack={noop}
        onRestart={noop}
        assumptions={DEFAULT_ASSUMPTIONS}
      />,
    );
    expect(html).toContain('10.51');
    expect(html).toContain('Quantity by bar diameter');
    expect(html).toContain('Split by element');
    expect(html).toContain('Assumptions used');
    expect(html).toContain('Not a structural design');
    expect(html).toContain('8 mm');
    expect(html).toContain('25 mm');
  });

  it('renders for every scope', () => {
    for (const s of SCOPES) {
      const r = estimate({
        areaSqFt: 1356.25,
        floors: 'G+2',
        plan: PLANS_BY_ID['fp-06'],
        scope: s.id,
      });
      const html = renderToString(
        <ResultView
          result={r}
          state={{ ...state, step: 5, scope: s.id }}
          dispatch={noop}
          onBack={noop}
          onRestart={noop}
          assumptions={DEFAULT_ASSUMPTIONS}
        />,
      );
      expect(html).toContain(s.label);
    }
  });

  it('renders a dash rather than a zero cost when the rate is blank', () => {
    const blanked = {
      ...result,
      totals: { ...result.totals, cost: NaN, blendedRatePerTonne: NaN },
    };
    const html = renderToString(
      <ResultView
        result={blanked}
        state={{ ...state, step: 5, rate: '' }}
        dispatch={noop}
        onBack={noop}
        onRestart={noop}
        assumptions={DEFAULT_ASSUMPTIONS}
      />,
    );
    expect(html).toContain('enter a rate per tonne');
    expect(html).not.toMatch(/\$\s*0(?!\d)/);
  });

  it('shows the validation errors instead of crashing on a bad estimate', () => {
    // 100 sq.ft is valid now that the fixed range is gone, so force a real error.
    const bad = estimate({ areaSqFt: 'not a number', floors: 'G' });
    expect(bad.ok).toBe(false);
    const html = renderToString(
      <ResultView
        result={bad}
        state={{ ...state, step: 5 }}
        dispatch={noop}
        onBack={noop}
        onRestart={noop}
        assumptions={DEFAULT_ASSUMPTIONS}
      />,
    );
    expect(html).toContain('can’t calculate this yet');
  });
});
