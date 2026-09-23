/** "Foundry" — a dark control-room skin for the Jindal Steel Oman estimator.
 *
 *  The brand's own orange (#F5821E) and green (#5AAA46) survive intact, but they
 *  are used as molten metal and as a go/confirm signal against rolled steel
 *  rather than as flat buttons on white. Everything resolves through CSS
 *  variables declared in styles/index.css, so the print stylesheet can swap the
 *  whole palette to ink-on-paper without touching a single component. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--c-base) / <alpha-value>)', // page
        panel: 'rgb(var(--c-panel) / <alpha-value>)', // card surface
        raised: 'rgb(var(--c-raised) / <alpha-value>)', // inputs, table heads
        line: 'rgb(var(--c-line) / <alpha-value>)', // hairlines
        ink: 'rgb(var(--c-ink) / <alpha-value>)', // primary text
        dim: 'rgb(var(--c-dim) / <alpha-value>)', // secondary text
        molten: {
          DEFAULT: 'rgb(var(--c-molten) / <alpha-value>)', // #F5821E
          hot: 'rgb(var(--c-molten-hot) / <alpha-value>)', // white-hot highlight
          deep: 'rgb(var(--c-molten-deep) / <alpha-value>)', // cooling ember
        },
        verdigris: 'rgb(var(--c-verdigris) / <alpha-value>)', // #5AAA46
      },
      fontFamily: {
        display: ['Archivo', 'Arial Black', 'sans-serif'],
        sans: ['Archivo', 'Helvetica Neue', 'sans-serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        // The easing jindalsteel.om uses on its sticky header.
        sticky: 'cubic-bezier(.645,.045,.355,1)',
      },
      boxShadow: {
        forge: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 18px 40px -24px rgb(0 0 0 / 0.9)',
        ember: '0 0 0 1px rgb(var(--c-molten) / 0.35), 0 12px 32px -12px rgb(var(--c-molten) / 0.3)',
      },
      keyframes: {
        // One orchestrated page load beats a dozen scattered hovers.
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pour: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        // A slow heat shimmer under the headline figure.
        heat: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        sweep: {
          from: { transform: 'translateX(-120%)' },
          to: { transform: 'translateX(220%)' },
        },
        // Bars draw themselves on. Paired with pathLength="100" so every line
        // takes the same time regardless of how long it actually is.
        draw: {
          from: { strokeDashoffset: '100' },
          to: { strokeDashoffset: '0' },
        },
        // Opacity only — a message appearing must never move the layout.
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        rise: 'rise 0.62s cubic-bezier(0.16, 0.84, 0.44, 1) both',
        pour: 'pour 0.9s cubic-bezier(0.16, 0.84, 0.44, 1) both',
        heat: 'heat 4.5s ease-in-out infinite',
        sweep: 'sweep 2.6s ease-in-out infinite',
        draw: 'draw 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        fade: 'fade 0.22s ease-out both',
      },
    },
  },
  plugins: [],
};
