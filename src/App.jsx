import { useEstimator, RESULT_STEP } from './hooks/useEstimator.js';
import { useTheme } from './hooks/useTheme.js';
import { useScrolled } from './hooks/useScrolled.js';
import { BrandHeader, Stepper, WizardNav, Disclaimer } from './components/ui/Primitives.jsx';
import StepArea from './components/wizard/StepArea.jsx';
import StepFloors from './components/wizard/StepFloors.jsx';
import StepPlan from './components/wizard/StepPlan.jsx';
import StepScope from './components/wizard/StepScope.jsx';
import ResultView from './components/result/ResultView.jsx';
import { DEFAULT_ASSUMPTIONS, DISCLAIMER } from './data/assumptions.js';
import { validateArea } from './lib/validation.js';

export default function App() {
  const assumptions = DEFAULT_ASSUMPTIONS;
  const { state, dispatch, result } = useEstimator(assumptions);
  const { isNight, toggle: toggleTheme } = useTheme();
  const scrolled = useScrolled();

  const next = () => dispatch({ type: 'next' });
  const back = () => dispatch({ type: 'back' });
  const restart = () => dispatch({ type: 'restart' });

  const areaInvalid = Boolean(validateArea(state.area, state.unit, assumptions));
  const onResult = state.step === RESULT_STEP;

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 sm:px-8">
      <BrandHeader
        onExit={state.step > 1 ? restart : null}
        isNight={isNight}
        onToggleTheme={toggleTheme}
        scrolled={scrolled}
      />

      {/* Keying on the step replays the reveal on every screen change, so each
          step arrives rather than snapping in. */}
      <main key={state.step} className="card card-hot mb-8 flex-1 animate-rise">
        {state.step > 1 && (
          <Stepper
            current={state.step}
            onGo={(n) => dispatch({ type: 'goto', step: n })}
            canGoForward={!areaInvalid}
          />
        )}

        {state.step === 1 && (
          <StepArea state={state} dispatch={dispatch} onNext={next} assumptions={assumptions} />
        )}
        {state.step === 2 && <StepFloors state={state} dispatch={dispatch} />}
        {state.step === 3 && <StepPlan state={state} dispatch={dispatch} />}
        {state.step === 4 && <StepScope state={state} dispatch={dispatch} />}
        {onResult && (
          <ResultView
            result={result}
            state={state}
            dispatch={dispatch}
            onBack={back}
            onRestart={restart}
            assumptions={assumptions}
          />
        )}

        {state.step > 1 && !onResult && (
          <WizardNav
            onBack={back}
            onNext={next}
            nextDisabled={areaInvalid}
            nextLabel={state.step === 4 ? 'Calculate' : 'Next'}
          />
        )}
      </main>

      <footer className="no-print border-t border-line pb-6 pt-4 text-center">
        <Disclaimer text={DISCLAIMER} className="mx-auto max-w-2xl" />
        <p className="mt-3 font-mono text-[9px] text-dim/50">
          Prototype · Jindal Steel Oman · not a production tool
        </p>
      </footer>
    </div>
  );
}
