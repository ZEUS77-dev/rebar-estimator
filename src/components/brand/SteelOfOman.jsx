/** The "Steel of Oman" campaign carousel — the brand moment on step 1.
 *
 *  Crossfades with a slow Ken Burns drift. The deck is shuffled once per mount,
 *  so the running order is different every visit.
 *
 *  No per-slide caption: these are finished campaign artworks that already
 *  carry their own typography, so printing the subject name under the frame
 *  only competes with it. The names stay in alt text for screen readers. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { STEEL_OF_OMAN, SLIDE_DIR, shuffled } from '../../data/steelOfOman.js';

const DWELL_MS = 5000;

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export default function SteelOfOman({ slides = STEEL_OF_OMAN }) {
  // Shuffle once, in the state initialiser — not on every render, which would
  // reshuffle on each keystroke elsewhere on the page.
  const [deck] = useState(() => shuffled(slides));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const timer = useRef(null);

  useEffect(() => setStill(prefersReducedMotion()), []);

  const go = useCallback(
    (n) => setIndex((i) => (n + deck.length) % deck.length),
    [deck.length],
  );

  useEffect(() => {
    if (paused || still || deck.length < 2) return undefined;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % deck.length), DWELL_MS);
    return () => clearTimeout(timer.current);
  }, [index, paused, still, deck.length]);

  const base = import.meta.env.BASE_URL;

  return (
    <section
      className="w-full"
      aria-roledescription="carousel"
      aria-label="The Steel of Oman"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="group relative aspect-square w-full overflow-hidden rounded-lg border border-line bg-raised">
        {deck.map((s, i) => (
          <img
            key={s.file}
            src={`${base}${SLIDE_DIR}${s.file}`}
            alt={s.title}
            /* First slide eager so the hero is never blank; the rest lazily. */
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            aria-hidden={i !== index}
            className={[
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-out',
              i === index ? 'opacity-100' : 'opacity-0',
              still ? '' : i === index ? 'scale-105' : 'scale-100',
              still ? '' : 'transition-[opacity,transform] duration-[6000ms]',
            ].join(' ')}
          />
        ))}

        {/* A molten hairline reading out the dwell, so the pause is legible. */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-line/60">
          <div
            key={`${index}-${paused}-${still}`}
            className="h-full bg-molten"
            style={{
              animation:
                paused || still ? 'none' : `pour ${DWELL_MS}ms linear both`,
              width: paused || still ? '0%' : undefined,
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-base/70 text-ink opacity-0 backdrop-blur transition-opacity hover:border-molten hover:text-molten focus:opacity-100 group-hover:opacity-100"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-base/70 text-ink opacity-0 backdrop-blur transition-opacity hover:border-molten hover:text-molten focus:opacity-100 group-hover:opacity-100"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Only the campaign line — the individual slide names (people, themes)
          stay in alt text for screen readers but are not printed under the
          frame, so the artwork speaks for itself. */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="label-eyebrow">The Steel of Oman</p>

        <div className="flex shrink-0 items-center gap-1.5">
          {deck.map((s, i) => (
            <button
              key={s.file}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to ${s.title}`}
              aria-current={i === index}
              className={[
                'h-1.5 rounded-full transition-all duration-300',
                i === index ? 'w-5 bg-molten' : 'w-1.5 bg-line hover:bg-dim',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
