/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#E2D9CC',
        espresso: '#2E211E',
        umber: '#6D5E51',
        sand: '#B1AA99',
        olive: '#868375',
        // ფუნქციური სტატუსის ფერები: გამოიყენება მხოლოდ გაფრთხილებებისთვის და ყოველთვის ტექსტთან/ხატულასთან ერთად
        brick: '#8F3A2C',
        ochre: '#8A5F1A',
      },
      fontFamily: {
        display: ['Fraunces', '"Noto Serif Georgian"', 'Georgia', 'serif'],
        sans: ['"Noto Sans Georgian"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(46,33,30,.06), 0 10px 28px -14px rgba(46,33,30,.35)',
        lift: '0 2px 4px rgba(46,33,30,.08), 0 24px 48px -24px rgba(46,33,30,.55)',
      },
      keyframes: {
        draw: { to: { strokeDashoffset: '0' } },
        breathe: { '0%,100%': { opacity: '.45', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.35)' } },
        toastIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        draw: 'draw 2.6s ease-out forwards',
        breathe: 'breathe 3.6s ease-in-out infinite',
        toastIn: 'toastIn .22s ease-out both',
      },
    },
  },
  plugins: [],
};
