import { useEstimator, RESULT_STEP } from './hooks/useEstimator.js';
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

  const next = () => dispatch({ type: 'next' });
  const back = () => dispatch({ type: 'back' });
  const restart = () => dispatch({ type: 'restart' });

  const areaInvalid = Boolean(validateArea(state.area, state.unit, assumptions));
  const onResult = state.step === RESULT_STEP;

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 sm:px-6">
      <BrandHeader onExit={state.step > 1 ? restart : null} />

      <main className="card mb-10 flex-1 overflow-hidden">
        {!onResult && state.step > 1 && <Stepper current={state.step} />}

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

      <footer className="no-print pb-8 text-center">
        <Disclaimer text={DISCLAIMER} className="mx-auto max-w-2xl" />
        <p className="mt-2 text-[11px] text-grey/70">
          Prototype · Jindal Steel Oman · not a production tool
        </p>
      </footer>
    </div>
  );
}
