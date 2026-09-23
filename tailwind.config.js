/** Jindal Panther brand tokens, lifted from the live site's own stylesheets:
 *  app.min.css Bootstrap overrides (--bs-primary/-secondary/-dark) and
 *  update-css-060226.css (.themeColor gradient, heading orange). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5E14', // --bs-primary
          600: '#FF6C00',
          700: '#E54000',
          800: '#CC4B10',
          900: '#99380C',
        },
        amber: { DEFAULT: '#F47A20', light: '#FFAA31', bright: '#FF9900' },
        navy: { DEFAULT: '#02245B', deep: '#011637', slate: '#1E2B3B' }, // --bs-dark
        grey: { DEFAULT: '#5F656F', light: '#F5F5F5' }, // --bs-secondary / --bs-light
        ink: '#414040',
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        alt: ['Open Sans', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        // .themeColor from update-css-060226.css
        'panther': 'linear-gradient(180deg, #FF9900 15.62%, #FF6C00 100%)',
        'panther-hover': 'linear-gradient(270.73deg, #FF6C00 -26.35%, #FF9900 73.64%)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(2,36,91,0.08), 0 8px 24px rgba(2,36,91,0.06)',
        lift: '0 4px 12px rgba(255,94,20,0.22)',
      },
    },
  },
  plugins: [],
};
