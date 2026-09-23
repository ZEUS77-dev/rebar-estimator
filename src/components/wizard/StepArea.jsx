import { NumberField, UnitToggle, ArrowRight } from '../ui/Primitives.jsx';
import { areaRangeHint, validateArea } from '../../lib/validation.js';
import { DEFAULT_ASSUMPTIONS } from '../../data/assumptions.js';

const VALUE_PROPS = [
  {
    title: 'Accurate projections',
    body: 'Calculate total property area, including carpet, walls, balconies, and more.',
    icon: (
      <path d="M4 17V7m0 10h16M8 14V9m4 5V5m4 9v-3" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Easy usage',
    body: 'No expertise needed, just input basic details.',
    icon: (
      <path
        d="M12 4v7m0 0l-3-3m3 3l3-3M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Negotiate confidently',
    body: 'Know market rates to negotiate better with contractors and suppliers.',
    icon: (
      <path
        d="M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM3 19a5 5 0 0110 0m-1 0a5 5 0 019 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

/** The construction illustration from the mockup, drawn rather than sourced -
 *  no artwork shipped with the brief. */
function SiteIllustration() {
  return (
    <svg viewBox="0 0 220 180" className="h-full w-full" role="img" aria-label="Building under construction">
      <circle cx="110" cy="86" r="78" fill="#F5821E" opacity="0.07" />
      {/* crane */}
      <g stroke="#414042" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M30 150V34" />
        <path d="M18 34h84" />
        <path d="M30 34l22 22M30 56l22-22" strokeWidth="1.6" />
        <path d="M78 34v16" strokeWidth="1.6" />
      </g>
      <rect x="70" y="50" width="16" height="10" fill="#F5821E" rx="1.5" />
      {/* building frame */}
      <g fill="none" stroke="#414042" strokeWidth="2.5">
        <rect x="96" y="66" width="96" height="84" rx="2" fill="#FFFFFF" />
        <path d="M96 94h96M96 122h96M128 66v84M160 66v84" strokeWidth="1.4" />
      </g>
      <rect x="99" y="69" width="26" height="22" fill="#F5821E" opacity="0.18" />
      <rect x="163" y="125" width="26" height="22" fill="#5AAA46" opacity="0.22" />
      {/* rebar bundle */}
      <g stroke="#6D6E71" strokeWidth="2.2" strokeLinecap="round">
        <path d="M24 150h56M28 156h52M32 162h44" />
      </g>
      <path d="M8 168h204" stroke="#414042" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function StepArea({ state, dispatch, onNext, assumptions = DEFAULT_ASSUMPTIONS }) {
  const error = validateArea(state.area, state.unit, assumptions);
  const touched = state.area !== '';

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="mx-auto h-48 w-full max-w-sm sm:h-60">
          <SiteIllustration />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Rebar Estimator</h1>
          <p className="mt-2 text-sm text-grey">
            Accurate, hassle-free rebar calculations for slabs, beams, columns, and more.
          </p>

          <h2 className="mt-7 text-lg font-semibold text-charcoal">Ground floor area</h2>
          <p className="mt-1 text-xs text-grey">{areaRangeHint()}</p>

          <div className="mt-3 flex flex-wrap items-start gap-3">
            <div className="min-w-[180px] flex-1">
              <NumberField
                prefix={state.unit === 'sqm' ? 'm²' : 'ft²'}
                value={state.area}
                onChange={(v) => dispatch({ type: 'setArea', value: v })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !error) onNext();
                }}
                error={touched && error}
                placeholder="0.00"
                aria-label="Ground floor area"
                aria-invalid={Boolean(touched && error)}
              />
            </div>
            <UnitToggle
              value={state.unit}
              onChange={(v) => dispatch({ type: 'setUnit', value: v })}
            />
          </div>

          {touched && error && (
            <p role="alert" className="mt-2 text-xs font-medium text-primary">
              {error.message}
            </p>
          )}

          <button type="button" className="btn-primary mt-6 w-full sm:w-auto" onClick={onNext} disabled={Boolean(error)}>
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {VALUE_PROPS.map((p) => (
          <div key={p.title} className="rounded-xl border border-grey-light bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  {p.icon}
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-semibold text-charcoal">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-grey">{p.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
