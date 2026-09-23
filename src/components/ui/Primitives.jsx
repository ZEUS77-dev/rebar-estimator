/** Small shared UI pieces: brand header, stepper rail, selectable tile, chip,
 *  unit toggle, number field, nav bar. Kept in one file because each is a few
 *  lines and they are only ever used together. */

import { STEPS } from '../../hooks/useEstimator.js';
import { UNIT_LABELS } from '../../lib/units.js';

/* ---------------------------------------------------------------- icons -- */

export const CheckIcon = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
    <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowRight = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M3 10h13m-5-5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowLeft = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M17 10H4m5-5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ExitIcon = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 3H4v14h8M9 10h8m-3-3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* --------------------------------------------------------------- header -- */

/** Charcoal band, because the only logo the brand ships is the white one —
 *  #414042 is the same footer colour the live site sets it against. */
export function BrandHeader({ onExit }) {
  return (
    <header className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-charcoal px-5 py-4">
      <div className="flex items-center gap-4">
        {/* BASE_URL, not a bare "/", so the logo still resolves when the app is
            served from a GitHub Pages sub-path. */}
        <img
          src={`${import.meta.env.BASE_URL}brand/jindal-steel-logo-white.svg`}
          alt="Jindal Steel Oman"
          className="h-11 w-auto sm:h-14"
        />
        <span className="hidden h-9 w-px bg-white/25 sm:block" />
        <div className="hidden sm:block">
          <div className="text-sm font-medium leading-tight text-white">Rebar Estimator</div>
          <div className="text-xs leading-tight text-muted">The Steel of Oman</div>
        </div>
      </div>
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="no-print inline-flex items-center gap-1.5 text-sm font-medium text-muted underline-offset-4 transition hover:text-white hover:underline"
        >
          Exit <ExitIcon className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}

/* -------------------------------------------------------------- stepper -- */

export function Stepper({ current }) {
  return (
    <nav aria-label="Progress" className="no-print border-b border-grey-light px-4 py-5 sm:px-8">
      <ol className="mx-auto flex max-w-3xl items-start">
        {STEPS.map((s, i) => {
          const done = current > s.n;
          const active = current === s.n;
          return (
            <li key={s.key} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition',
                    done
                      ? 'bg-primary text-white'
                      : active
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'border border-grey/40 bg-white text-grey',
                  ].join(' ')}
                >
                  {done ? <CheckIcon className="h-4 w-4" /> : s.n}
                </span>
                <span
                  className={[
                    'w-20 text-center text-[11px] leading-tight sm:w-28 sm:text-xs',
                    active ? 'font-semibold text-charcoal' : 'text-grey',
                  ].join(' ')}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={[
                    'mt-4 h-0.5 flex-1 rounded transition',
                    done ? 'bg-primary' : 'bg-grey/20',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------- tiles -- */

/** `as="div"` is needed wherever the tile wraps tall content: a <button> will not
 *  grow to fit its children the way a block container does, so the card clips. */
export function Tile({ selected, onClick, className = '', as = 'button', children, ...rest }) {
  const El = as;
  const elProps =
    as === 'button'
      ? { type: 'button' }
      : {
          role: 'button',
          tabIndex: 0,
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick?.();
            }
          },
        };

  return (
    <El
      {...elProps}
      onClick={onClick}
      aria-pressed={selected}
      className={`tile ${selected ? 'tile-selected' : ''} ${className}`}
      {...rest}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      )}
      {children}
    </El>
  );
}

export function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`chip ${selected ? 'chip-selected' : ''}`}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------- area input -- */

export function UnitToggle({ value, onChange }) {
  return (
    <div
      role="group"
      aria-label="Area unit"
      className="inline-flex overflow-hidden rounded-lg border border-grey/40 bg-white"
    >
      {Object.entries(UNIT_LABELS).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={[
            'px-4 py-3 text-sm font-medium transition',
            value === id ? 'bg-primary text-white' : 'text-grey hover:text-primary',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function NumberField({ value, onChange, prefix, error, ...rest }) {
  return (
    <div
      className={[
        'flex items-center overflow-hidden rounded-lg border bg-white transition',
        error ? 'border-primary' : 'border-grey/40 focus-within:border-primary',
      ].join(' ')}
    >
      {prefix && (
        <span className="border-r border-grey-light bg-grey-light px-3 py-3 text-sm text-grey">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 text-center text-lg font-medium text-charcoal outline-none"
        {...rest}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ nav -- */

export function WizardNav({ onBack, onNext, nextLabel = 'Next', nextDisabled, backLabel = 'Back' }) {
  return (
    <div className="no-print flex items-center justify-between gap-4 border-t border-grey-light px-4 py-5 sm:px-8">
      {onBack ? (
        <button type="button" className="btn-ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </button>
      ) : (
        <span />
      )}
      <button type="button" className="btn-primary" onClick={onNext} disabled={nextDisabled}>
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ----------------------------------------------------------- misc bits -- */

export function StepHeading({ eyebrow = 'Rebar Estimator', title, sub }) {
  return (
    <div className="text-center">
      <p className="label-eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold text-charcoal sm:text-2xl">{title}</h2>
      {sub && <p className="mx-auto mt-2 max-w-xl text-sm text-grey">{sub}</p>}
    </div>
  );
}

export function Disclaimer({ text, className = '' }) {
  return (
    <p className={`text-xs leading-relaxed text-grey ${className}`}>
      <span className="font-semibold text-charcoal">Please note: </span>
      {text}
    </p>
  );
}
