/** Shared UI: brand header, stepper rail, selectable tile, chip, unit toggle,
 *  number field, nav bar. One file because each is a few lines and they are
 *  only ever used together. */

import { STEPS } from '../../hooks/useEstimator.js';
import { UNIT_LABELS } from '../../lib/units.js';
import BrandMark from './BrandMark.jsx';

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

/** Sticky, and it collapses on scroll — the same move jindalsteel.om makes:
 *  padding closes up, the ground goes solid, the mark shrinks, all on the
 *  site's own 0.4s cubic-bezier(.645,.045,.355,1).
 *
 *  BrandMark rather than the raw SVG file: the shipped logo is white-only and
 *  would vanish on the daylight ground, so the wordmark inherits currentColor.
 *
 *  The negative margins let the solid bar bleed to the viewport edges while the
 *  content inside stays on the page's column. */
export function BrandHeader({ onExit, isNight, onToggleTheme, scrolled = false }) {
  return (
    <header
      className={[
        'sticky top-0 z-50 -mx-4 flex items-center justify-between gap-4 px-4 sm:-mx-8 sm:px-8',
        'transition-all duration-[400ms] ease-sticky',
        scrolled
          ? 'border-b border-line bg-base/85 py-2.5 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent py-4',
      ].join(' ')}
    >
      <div className="flex items-center gap-4">
        <BrandMark
          className={[
            'w-auto text-ink transition-all duration-[400ms] ease-sticky',
            scrolled ? 'h-8 sm:h-9' : 'h-11 sm:h-12',
          ].join(' ')}
        />
        <span className="hidden h-8 w-px bg-line sm:block" />
        <div className="hidden sm:block">
          <div className="font-mono text-[10px] text-molten">Rebar Estimator</div>
          {/* The strapline is the first thing to go when the bar closes up. */}
          <div
            className={[
              'overflow-hidden text-xs text-dim transition-all duration-[400ms] ease-sticky',
              scrolled ? 'mt-0 max-h-0 opacity-0' : 'mt-1 max-h-5 opacity-100',
            ].join(' ')}
          >
            The Steel of Oman
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="no-print inline-flex items-center gap-1.5 font-mono text-xs text-dim transition-colors hover:text-molten"
          >
            Exit <ExitIcon className="h-3.5 w-3.5" />
          </button>
        )}
        <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}


/* --------------------------------------------------------- theme switch -- */

/** Day is the default ground; this only ever remembers a deliberate choice.
 *  A single control that shows the ground you would switch TO, which tests
 *  better than showing the state you are already in. */
export function ThemeToggle({ isNight, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isNight}
      title={isNight ? 'Switch to day' : 'Switch to night'}
      className="no-print group relative inline-flex h-8 w-[3.75rem] items-center rounded-full border border-line bg-raised px-1 transition-colors hover:border-molten focus:outline-none focus-visible:ring-2 focus-visible:ring-molten focus-visible:ring-offset-2 focus-visible:ring-offset-base"
    >
      <span className="sr-only">{isNight ? 'Switch to day theme' : 'Switch to night theme'}</span>
      <span
        aria-hidden
        className={[
          'flex h-6 w-6 items-center justify-center rounded-full bg-molten text-panel transition-transform duration-300 ease-out',
          isNight ? 'translate-x-[1.75rem]' : 'translate-x-0',
        ].join(' ')}
      >
        {isNight ? (
          /* moon */
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M13.2 10.4A5.6 5.6 0 0 1 5.6 2.8a5.6 5.6 0 1 0 7.6 7.6Z" />
          </svg>
        ) : (
          /* sun */
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.2 1.2M11.8 11.8 13 13M13 3l-1.2 1.2M4.2 11.8 3 13" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------- stepper -- */

/** Reads as a gauge rather than a breadcrumb: the completed run of the rail is
 *  molten, the rest is cold steel — and every stop on it is a jump target.
 *
 *  Going back is always allowed. Going forward is allowed only once the area is
 *  valid, because that is the one answer the wizard genuinely requires — floors,
 *  plan and scope all have workable defaults. Without that guard you could skip
 *  from an empty first screen straight to a result that cannot be computed. */
export function Stepper({ current, onGo, canGoForward = true }) {
  return (
    <nav aria-label="Progress" className="no-print border-b border-line px-4 py-4 sm:px-8">
      <ol className="mx-auto flex max-w-3xl items-start">
        {STEPS.map((s, i) => {
          const done = current > s.n;
          const active = current === s.n;
          const navigable = Boolean(onGo) && !active && (s.n < current || canGoForward);

          const marker = (
            <>
              <span
                className={[
                  'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-mono text-[10px] font-bold transition-all duration-300',
                  done
                    ? 'bg-molten text-base'
                    : active
                      ? 'bg-molten text-base shadow-ember'
                      : 'border border-line bg-panel text-dim',
                  navigable ? 'group-hover:shadow-ember' : '',
                ].join(' ')}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : String(s.n).padStart(2, '0')}
                {active && (
                  <span className="absolute -inset-1 animate-heat rounded-sm bg-molten/25 blur-sm" />
                )}
              </span>
              <span
                className={[
                  'w-20 text-center font-mono text-[9px] leading-tight transition-colors sm:w-28',
                  active ? 'text-molten' : done ? 'text-dim' : 'text-dim/50',
                  navigable ? 'group-hover:text-molten' : '',
                ].join(' ')}
              >
                {s.label}
              </span>
            </>
          );

          return (
            <li key={s.key} className="flex flex-1 items-start last:flex-none">
              {navigable ? (
                <button
                  type="button"
                  onClick={() => onGo(s.n)}
                  className="group flex cursor-pointer flex-col items-center gap-2.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-molten focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                >
                  {marker}
                </button>
              ) : (
                <div
                  aria-current={active ? 'step' : undefined}
                  className={[
                    'flex flex-col items-center gap-2.5',
                    // Unreachable while the area is still invalid.
                    !active && onGo ? 'cursor-not-allowed opacity-60' : '',
                  ].join(' ')}
                >
                  {marker}
                </div>
              )}
              {i < STEPS.length - 1 && (
                <span aria-hidden className="mt-3.5 h-px flex-1 bg-line">
                  <span
                    className={[
                      'block h-px origin-left transition-transform duration-500',
                      done ? 'scale-x-100 bg-molten' : 'scale-x-0 bg-molten',
                    ].join(' ')}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------- tiles -- */

/** `as="div"` wherever the tile wraps tall content: a <button> will not grow to
 *  fit its children the way a block container does, so the card clips. */
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
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-sm bg-molten text-base">
          <CheckIcon className="h-3 w-3" />
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
      className="inline-flex overflow-hidden rounded border border-line bg-raised"
    >
      {Object.entries(UNIT_LABELS).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={[
            'px-4 py-3 font-mono text-[10px] transition-colors',
            value === id ? 'bg-molten text-base' : 'text-dim hover:text-molten',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** The one place the page lets numbers get big — it is the primary input. */
export function NumberField({ value, onChange, prefix, error, ...rest }) {
  return (
    <div className={`field ${error ? '!border-molten-deep' : ''}`}>
      {prefix && (
        <span className="border-r border-line px-3.5 py-3.5 font-mono text-xs text-dim">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent px-4 py-3 text-center font-mono text-2xl font-medium tabular-nums text-ink outline-none placeholder:text-dim/30"
        {...rest}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ nav -- */

/** Sticky to the bottom of the viewport so Next is reachable without scrolling,
 *  however long the step runs. It settles into the foot of the card once the
 *  whole step fits on screen, so on short steps it reads as a normal footer
 *  rather than a floating bar.
 *
 *  This is why the card must not use overflow-hidden — that turns it into a
 *  scroll container and position:sticky stops working inside it. */
export function WizardNav({ onBack, onNext, nextLabel = 'Next', nextDisabled, backLabel = 'Back' }) {
  return (
    <div className="no-print sticky bottom-0 z-30 flex items-center justify-between gap-4 rounded-b-lg border-t border-line bg-panel/90 px-4 py-3.5 backdrop-blur-md sm:px-8">
      {onBack ? (
        <button type="button" className="btn-ghost" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
        </button>
      ) : (
        <span />
      )}
      <button type="button" className="btn-primary" onClick={onNext} disabled={nextDisabled}>
        {nextLabel} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ----------------------------------------------------------- misc bits -- */

export function StepHeading({ eyebrow = 'Rebar Estimator', title, sub }) {
  return (
    <div className="text-center">
      <p className="label-eyebrow">{eyebrow}</p>
      <h2 className="mt-1.5 text-lg text-ink sm:text-xl">{title}</h2>
      {sub && <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-dim">{sub}</p>}
    </div>
  );
}

export function Disclaimer({ text, className = '' }) {
  return (
    <p className={`text-xs leading-relaxed text-dim ${className}`}>
      <span className="font-mono text-[10px] text-molten">Note </span>
      {text}
    </p>
  );
}
