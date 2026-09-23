/** Jindal Steel Oman brand tokens, lifted from the live site's own compiled CSS
 *  (jindalsteel.om) and from jindal-steel-logo-white.svg.
 *
 *  Note there is no navy in this brand — the "dark" is a warm charcoal. And the
 *  signature interaction is an orange button that turns green on hover, not a
 *  gradient. Both differ from the Jindal Panther (India) skin this replaced. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — Jindal Orange. rgb(245 130 30) in the site's Tailwind build;
        // the logo SVG uses #F58220 and inline SVG strokes use #F47920.
        primary: { DEFAULT: '#F5821E', logo: '#F58220', stroke: '#F47920' },
        // Secondary — Jindal Green. rgb(90 170 70).
        green: { DEFAULT: '#5AAA46', logo: '#58AB40' },
        // Dark — footer background and body text. rgb(65 64 66).
        charcoal: { DEFAULT: '#414042', line: '#47494E' },
        // Neutrals
        muted: '#A7A9AC', // rgb(167 169 172) — secondary text, icons
        grey: { DEFAULT: '#6D6E71', light: '#E5E5E6' }, // quaternary / tertiary
        offwhite: '#F7F7F7', // logo wordmark
      },
      fontFamily: {
        // Self-hosted Roboto on the live site; loaded from Google Fonts here.
        sans: ['Roboto', 'Arial', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        // Verbatim from the site's Tailwind build.
        card: '0px 4px 8px 0px rgba(0,0,0,0.15)',
        soft: '1px 2px 4px 0px rgba(0,0,0,0.15)',
        lift: '2px 4px 4px 0px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
