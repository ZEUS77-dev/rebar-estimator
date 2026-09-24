import { NumberField, UnitToggle, Chip, ArrowRight } from '../ui/Primitives.jsx';
import SteelOfOman from '../brand/SteelOfOman.jsx';
import { areaRangeHint, isOutsideRecommended, validateArea } from '../../lib/validation.js';
import {
  DEFAULT_ASSUMPTIONS,
  BUILDING_TYPES_LIST,
  DEFAULT_BUILDING_TYPE,
  withBuildingType,
} from '../../data/assumptions.js';

const VALUE_PROPS = [
  {
    k: '01',
    title: 'Accurate projections',
    body: 'Total property area, including carpet, walls, balconies and more.',
  },
  { k: '02', title: 'Easy usage', body: 'No expertise needed, just input basic details.' },
  {
    k: '03',
    title: 'Negotiate confidently',
    body: 'Know market rates to negotiate better with contractors and suppliers.',
  },
];

/** The out-of-range nudge. Rendered twice on step 1 — once invisibly to reserve
 *  the slot height at whatever width the text happens to wrap to, and once for
 *  real on top of it — so showing or hiding it never moves the page.
 *
 *  Neutral grey on purpose: this is advice, not a failure, and the molten hue
 *  is reserved for messages that actually block. */
function Note({ className = '', ...rest }) {
  return (
    <p
      className={`flex items-start gap-2 text-xs leading-relaxed text-dim ${className}`}
      {...rest}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 5v3.5M8 11h.01" strokeLinecap="round" />
      </svg>
      <span>
        That is outside the recommended range. You can still continue — the thumb rules behind
        this estimate are calibrated for a narrower range, so treat the result with extra caution.
      </span>
    </p>
  );
}

export default function StepArea({ state, dispatch, onNext, assumptions = DEFAULT_ASSUMPTIONS }) {
  // Self-sufficient rather than trusting the caller to have already resolved
  // the building type: idempotent, so it is harmless that useEstimator has
  // usually done this already by the time `assumptions` gets here.
  const effective = withBuildingType(assumptions, state.buildingType ?? DEFAULT_BUILDING_TYPE);

  const error = validateArea(state.area, state.unit, effective);
  const touched = state.area !== '';
  // Advisory only — an area outside the recommended band still calculates.
  const outsideRecommended = !error && isOutsideRecommended(state.area, state.unit, effective);

  return (
    <div className="stagger px-4 py-6 sm:px-8">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr]" style={{ '--i': 0 }}>
        <div className="mx-auto w-full max-w-sm">
          <SteelOfOman />
        </div>

        <div>
          <p className="label-eyebrow">Jindal Steel Oman</p>
          <h1 className="mt-3 text-3xl leading-[1.05] text-ink sm:text-[2.6rem]">
            Rebar
            <br />
            Estimator
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-dim">
            Accurate, hassle-free rebar calculations for slabs, beams, columns and more.
          </p>

          <div className="mt-8 h-px w-full origin-left bg-gradient-to-r from-molten via-molten/30 to-transparent rule-pour" />

          {/* Recommended, not enforced - same philosophy as the area band below.
              Picking Apartment only widens what counts as a typical area; the
              engine underneath is identical either way (see withBuildingType
              in assumptions.js). */}
          <h2 className="mt-8 font-mono text-[11px] text-ink">Building type</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {BUILDING_TYPES_LIST.map((t) => (
              <Chip
                key={t.id}
                selected={(state.buildingType ?? DEFAULT_BUILDING_TYPE) === t.id}
                onClick={() => dispatch({ type: 'setBuildingType', value: t.id })}
              >
                {t.label}
              </Chip>
            ))}
          </div>

          <h2 className="mt-6 font-mono text-[11px] text-ink">
            Ground floor area
          </h2>
          <p className="mt-2 text-xs text-dim">{areaRangeHint(state.unit, effective)}</p>

          <div className="mt-4 flex flex-wrap items-stretch gap-3">
            <div className="min-w-[200px] flex-1">
              <NumberField
                prefix={state.unit === 'sqm' ? 'm²' : 'ft²'}
                value={state.area}
                onChange={(v) => dispatch({ type: 'setArea', value: v })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !error) onNext();
                }}
                error={touched && error}
                placeholder="0"
                aria-label="Ground floor area"
                aria-invalid={Boolean(touched && error)}
              />
            </div>
            <UnitToggle value={state.unit} onChange={(v) => dispatch({ type: 'setUnit', value: v })} />
          </div>

          {/* Message slot.
              Errors and the out-of-range nudge are mutually exclusive, and both
              used to be conditionally mounted — so typing 40000 pushed the
              button and the cards below it down the page. The slot now always
              occupies the height of the LONGEST message: a copy of the nudge is
              rendered invisibly to hold the space, and the live message is laid
              over it. Reserving with a fixed px height would break as soon as
              the text wrapped to a different number of lines, so the spacer is
              the real text instead. */}
          <div className="relative mt-3">
            <Note aria-hidden className="invisible" />
            <div className="absolute inset-0">
              {touched && error ? (
                <p role="alert" className="animate-fade font-mono text-[11px] text-molten">
                  {error.message}
                </p>
              ) : outsideRecommended ? (
                <Note className="animate-fade" />
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary mt-7 w-full sm:w-auto"
            onClick={onNext}
            disabled={Boolean(error)}
          >
            Begin <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-3">
        {VALUE_PROPS.map((p, i) => (
          <div key={p.title} className="bg-panel p-6" style={{ '--i': i + 1 }}>
            <span className="font-mono text-[10px] text-molten/70">{p.k}</span>
            <h3 className="mt-3 text-sm font-semibold text-ink">{p.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-dim">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
