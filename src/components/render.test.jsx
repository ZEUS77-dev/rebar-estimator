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
import { Stepper, ThemeToggle, BrandHeader, WizardNav } from './ui/Primitives.jsx';
import SteelOfOman from './brand/SteelOfOman.jsx';
import { STEEL_OF_OMAN, shuffled } from '../data/steelOfOman.js';

import { estimate } from '../lib/estimator.js';
import { FLOOR_PLANS, PLANS_BY_ID, PLANS_IN_ORDER, BHK_FILTERS } from '../data/floorPlans.js';
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
    expect(html).toContain('Recommended 500 – 3,000 sq. ft.');
  });

  it('renders step 1', () => {
    const html = renderToString(
      <StepArea state={state} dispatch={noop} onNext={noop} assumptions={DEFAULT_ASSUMPTIONS} />,
    );
    expect(html).toContain('Negotiate confidently');
    expect(html).toContain('Recommended 500 – 3,000 sq. ft.');
  });

  it('converts the recommended range when the unit is square metres', () => {
    const html = renderToString(
      <StepArea
        state={{ ...state, unit: 'sqm', area: '126' }}
        dispatch={noop}
        onNext={noop}
        assumptions={DEFAULT_ASSUMPTIONS}
      />,
    );
    expect(html).toContain('Recommended 46 – 279 sq. mts.');
  });

  /* The message slot always renders an invisible copy of the nudge to hold its
     height, so counting occurrences is how we tell "showing" from "reserved". */
  const NUDGE = 'outside the recommended range';
  const countNudge = (html) => (html.match(new RegExp(NUDGE, 'g')) || []).length;
  const renderStep1 = (over) =>
    renderToString(
      <StepArea
        state={{ ...state, ...over }}
        dispatch={noop}
        onNext={noop}
        assumptions={DEFAULT_ASSUMPTIONS}
      />,
    );

  it('nudges but does not error when the area is outside the recommended band', () => {
    const html = renderStep1({ area: '40000' });
    expect(countNudge(html)).toBe(2); // invisible spacer + the live message
    expect(html).toContain('You can still continue');
    expect(html).not.toContain('role="alert"');
  });

  it('reserves the message slot even when there is nothing to say', () => {
    // No shift: the slot is the same height whether or not a message shows.
    const quiet = renderStep1({ area: '1200' });
    expect(countNudge(quiet)).toBe(1); // spacer only
    expect(quiet).toContain('invisible');
    expect(quiet).not.toContain('role="alert"');
  });

  it('keeps the slot reserved while showing a blocking error', () => {
    const bad = renderStep1({ area: '0' });
    expect(bad).toContain('role="alert"');
    expect(bad).toContain('greater than zero');
    expect(countNudge(bad)).toBe(1); // the spacer still holds the height
  });

  it('hides the spacer from assistive tech so it is not read twice', () => {
    const html = renderStep1({ area: '40000' });
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders step 2 with all three floor options', () => {
    const html = renderToString(<StepFloors state={state} dispatch={noop} />);
    expect(html).toContain('Ground');
    expect(html).toContain('G+1');
    expect(html).toContain('G+2');
  });

  it('renders step 3 as a filmstrip plus a detail pane', () => {
    const html = renderToString(<StepPlan state={state} dispatch={noop} />);
    // fp-05 is the selected plan, so it is what the big pane shows.
    expect(html).toContain('1,528.49');
    expect(html).toContain('2BHK');
    expect(html).toContain('Layout factor');
    expect(html).toContain('Selected');
    // One thumbnail per plan in the strip, plus the large drawing.
    expect((html.match(/<svg/g) || []).length).toBeGreaterThan(FLOOR_PLANS.length);
  });

  it('has no confirm button — the thumbnail click is the selection', () => {
    const html = renderToString(<StepPlan state={state} dispatch={noop} />);
    expect(html).not.toContain('Select this plan');
    expect(html).toContain('Press Next to continue');
  });

  it('prompts to pick one when nothing is selected', () => {
    const html = renderToString(<StepPlan state={{ ...state, planId: null }} dispatch={noop} />);
    expect(html).toContain('Pick a plan from the strip');
    expect(html).toContain('the estimate assumes a simple rectangular layout');
    expect(html).not.toContain('Press Next to continue');
  });

  it('puts the spec sheet beside the drawing, one row per field', () => {
    const html = renderToString(<StepPlan state={state} dispatch={noop} />);
    for (const k of ['Area', 'Type', 'Rooms', 'Layout factor']) {
      expect(html, k).toContain(`>${k}</dt>`);
    }
    // stacked rows, not a horizontal grid strip
    expect(html).toContain('divide-y');
  });

  it('falls back to a visible plan when the filter hides the viewed one', () => {
    // Viewing a 2BHK while filtering to 4BHK must not blank the detail pane.
    const html = renderToString(
      <StepPlan state={{ ...state, planId: 'fp-05', bhkFilter: 4 }} dispatch={noop} />,
    );
    expect(html).toContain('4BHK');
    expect(html).not.toContain('Nothing to show for this filter');
  });

  it('renders step 3 filtered to 4BHK without emptying the strip', () => {
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

describe('theme switch', () => {
  it('offers night when on day, and day when on night', () => {
    expect(renderToString(<ThemeToggle isNight={false} onToggle={noop} />)).toContain(
      'Switch to night theme',
    );
    expect(renderToString(<ThemeToggle isNight onToggle={noop} />)).toContain(
      'Switch to day theme',
    );
  });

  it('exposes pressed state for assistive tech', () => {
    expect(renderToString(<ThemeToggle isNight onToggle={noop} />)).toContain('aria-pressed="true"');
  });
});

describe('steel of oman carousel', () => {
  it('renders every campaign slide', () => {
    const html = renderToString(<SteelOfOman />);
    for (const s of STEEL_OF_OMAN) {
      expect(html, s.file).toContain(s.file);
      expect(html, s.title).toContain(`alt="${s.title}"`);
    }
  });

  it('shows exactly one slide at a time', () => {
    const html = renderToString(<SteelOfOman />);
    // Scope to the <img> tags — the arrow buttons carry opacity classes too.
    const imgs = html.match(/<img\b[^>]*>/g) || [];
    expect(imgs).toHaveLength(STEEL_OF_OMAN.length);
    expect(imgs.filter((t) => /\bopacity-100\b/.test(t))).toHaveLength(1);
    expect(imgs.filter((t) => t.includes('aria-hidden="true"'))).toHaveLength(
      STEEL_OF_OMAN.length - 1,
    );
  });

  it('loads the first slide eagerly and the rest lazily', () => {
    const html = renderToString(<SteelOfOman />);
    expect((html.match(/loading="eager"/g) || []).length).toBe(1);
    expect((html.match(/loading="lazy"/g) || []).length).toBe(STEEL_OF_OMAN.length - 1);
  });

  it('is announced as a carousel and labelled', () => {
    const html = renderToString(<SteelOfOman />);
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('The Steel of Oman');
    expect(html).toContain('Previous slide');
    expect(html).toContain('Next slide');
  });

  it('does not print the subject names under the frame', () => {
    const html = renderToString(<SteelOfOman />);
    // The names survive in alt text and dot labels for assistive tech, but must
    // not appear as visible caption text beneath the artwork.
    const afterFrame = html.slice(html.lastIndexOf('</button></div>'));
    for (const name of ['Adnan Al Raisi', 'Ali Al Habsi', 'Mohammed']) {
      expect(afterFrame, name).not.toContain(`>${name}<`);
    }
    expect(html).toContain('alt="Adnan Al Raisi"');
  });
});

describe('shuffled()', () => {
  it('keeps every slide exactly once', () => {
    const out = shuffled(STEEL_OF_OMAN);
    expect(out).toHaveLength(STEEL_OF_OMAN.length);
    expect(new Set(out.map((s) => s.file))).toEqual(new Set(STEEL_OF_OMAN.map((s) => s.file)));
  });

  it('does not mutate the source deck', () => {
    const before = STEEL_OF_OMAN.map((s) => s.file);
    shuffled(STEEL_OF_OMAN);
    expect(STEEL_OF_OMAN.map((s) => s.file)).toEqual(before);
  });

  it('actually reorders — a fixed rand reverses nothing into identity', () => {
    // rand() = 0 always sends each element to the front, which must change order.
    const out = shuffled(STEEL_OF_OMAN, () => 0);
    expect(out.map((s) => s.file)).not.toEqual(STEEL_OF_OMAN.map((s) => s.file));
  });
});

describe('sticky header', () => {
  it('is pinned to the top of the viewport', () => {
    const html = renderToString(<BrandHeader isNight={false} onToggleTheme={noop} />);
    expect(html).toContain('sticky');
    expect(html).toContain('top-0');
  });

  it('opens up at the top of the page', () => {
    const html = renderToString(<BrandHeader scrolled={false} isNight={false} onToggleTheme={noop} />);
    expect(html).toContain('py-4');
    expect(html).toContain('bg-transparent');
    expect(html).toContain('The Steel of Oman');
  });

  it('collapses to a solid strip once scrolled', () => {
    const html = renderToString(<BrandHeader scrolled isNight={false} onToggleTheme={noop} />);
    expect(html).toContain('py-2.5');
    expect(html).toContain('backdrop-blur-md');
    expect(html).toContain('border-line');
    // the mark shrinks rather than disappearing
    expect(html).toContain('h-8');
    expect(html).not.toContain('h-11');
  });

  it('uses the easing curve the live site uses', () => {
    const html = renderToString(<BrandHeader scrolled isNight={false} onToggleTheme={noop} />);
    expect(html).toContain('ease-sticky');
  });
});

describe('floor plan ordering', () => {
  it('lists the BHK filters 2 then 3 then 4', () => {
    expect(BHK_FILTERS).toEqual([2, 3, 4]);
  });

  it('orders the gallery by BHK ascending, then by area', () => {
    const bhks = PLANS_IN_ORDER.map((p) => p.bhk);
    expect(bhks).toEqual([...bhks].sort((a, b) => a - b));
    for (let i = 1; i < PLANS_IN_ORDER.length; i++) {
      const a = PLANS_IN_ORDER[i - 1];
      const b = PLANS_IN_ORDER[i];
      if (a.bhk === b.bhk) expect(b.areaSqFt).toBeGreaterThanOrEqual(a.areaSqFt);
    }
  });

  it('keeps every plan and leaves the source array alone', () => {
    expect(PLANS_IN_ORDER).toHaveLength(FLOOR_PLANS.length);
    expect(new Set(PLANS_IN_ORDER.map((p) => p.id))).toEqual(
      new Set(FLOOR_PLANS.map((p) => p.id)),
    );
    // FLOOR_PLANS keeps its authoring order so ids stay stable.
    expect(FLOOR_PLANS[0].id).toBe('fp-01');
  });

  it('renders the chips in 2, 3, 4 order', () => {
    const html = renderToString(<StepPlan state={state} dispatch={noop} />);
    const order = ['2BHK', '3BHK', '4BHK'].map((t) => html.indexOf(`>${t}<`));
    expect(order.every((i) => i > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('stepper navigation', () => {
  const railOf = (props) => renderToString(<Stepper {...props} />);

  it('is inert when no handler is given', () => {
    const html = railOf({ current: 3 });
    expect(html).not.toContain('<button');
  });

  it('makes completed steps clickable', () => {
    const html = railOf({ current: 3, onGo: noop, canGoForward: true });
    // steps 1 and 2 are behind, step 4 is ahead and reachable -> 3 buttons
    expect((html.match(/<button/g) || []).length).toBe(3);
  });

  it('never makes the current step a jump target', () => {
    const html = railOf({ current: 2, onGo: noop, canGoForward: true });
    expect(html).toContain('aria-current="step"');
    // the current step stays a div, so it cannot be clicked back onto itself
    const current = html.slice(html.indexOf('aria-current="step"'));
    expect(current.slice(0, 40)).not.toContain('button');
  });

  it('blocks forward jumps while the area is invalid', () => {
    const open = railOf({ current: 2, onGo: noop, canGoForward: true });
    const shut = railOf({ current: 2, onGo: noop, canGoForward: false });
    expect((shut.match(/<button/g) || []).length).toBeLessThan(
      (open.match(/<button/g) || []).length,
    );
    expect(shut).toContain('cursor-not-allowed');
  });

  it('still allows going back when the area is invalid', () => {
    const html = railOf({ current: 3, onGo: noop, canGoForward: false });
    // steps 1 and 2 are behind the current one and must stay reachable
    expect((html.match(/<button/g) || []).length).toBe(2);
  });

  it('offers every step as a jump target from the result screen', () => {
    const html = railOf({ current: 5, onGo: noop, canGoForward: true });
    expect((html.match(/<button/g) || []).length).toBe(4);
  });
});

describe('step 4 density', () => {
  it('lays the scopes out in a single row on a wide screen', () => {
    const html = renderToString(<StepScope state={state} dispatch={noop} />);
    expect(html).toContain('lg:grid-cols-5');
  });

  it('explains only the grade in play, not all nine', () => {
    const rec = renderToString(<StepScope state={state} dispatch={noop} />);
    expect(rec).toContain('A615 Gr-60 throughout');

    const picked = renderToString(
      <StepScope state={{ ...state, grade: 'A1035' }} dispatch={noop} />,
    );
    expect(picked).toContain('Corrosion resistant');
    expect(picked).not.toContain('A615 Gr-60 throughout');
  });
});

describe('wizard nav', () => {
  it('sticks to the bottom so Next needs no scrolling', () => {
    const html = renderToString(<WizardNav onBack={noop} onNext={noop} />);
    expect(html).toContain('sticky');
    expect(html).toContain('bottom-0');
  });

  it('is opaque enough to sit over content', () => {
    const html = renderToString(<WizardNav onBack={noop} onNext={noop} />);
    expect(html).toContain('bg-panel/90');
    expect(html).toContain('backdrop-blur-md');
  });

  it('still disables Next when asked', () => {
    const html = renderToString(<WizardNav onBack={noop} onNext={noop} nextDisabled />);
    expect(html).toContain('disabled');
  });
});
