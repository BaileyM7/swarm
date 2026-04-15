import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- Core semantic tokens (DESIGN.md exact) ----
        background: '#0a0e1a',
        'surface-container-lowest': '#0d1220',
        'surface-container-low': '#121828',
        'surface-container': '#171e31',
        'surface-container-high': '#1d253c',
        'surface-container-highest': '#232d49',
        'outline-variant': '#3e484f',
        // ---- Domain palette ----
        cyber: '#5bc9ff',
        kinetic: '#ff5c7a',
        economic: '#f5a623',
        info: '#a78bfa',
        // ---- Surface text ----
        'on-surface': '#dfe2f3',
        'on-surface-variant': '#bec8d0',
        'on-primary': '#003549',
        'on-primary-container': '#005371',
        'primary-container': '#5bc9ff',
        'surface-bright': '#353946',
        'outline': '#88929a',
        'error': '#ffb4ab',
        'error-container': '#93000a',
        'secondary': '#ffb955',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'film-grain': {
          '0%, 100%': { backgroundPosition: '0 0' },
          '10%': { backgroundPosition: '-5% -10%' },
          '20%': { backgroundPosition: '-15% 5%' },
          '30%': { backgroundPosition: '7% -25%' },
          '40%': { backgroundPosition: '20% 25%' },
          '50%': { backgroundPosition: '-25% 10%' },
          '60%': { backgroundPosition: '15% 5%' },
          '70%': { backgroundPosition: '0% 15%' },
          '80%': { backgroundPosition: '25% 35%' },
          '90%': { backgroundPosition: '-10% 10%' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'expand-down': {
          from: { maxHeight: '0', opacity: '0' },
          to: { maxHeight: '500px', opacity: '1' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'film-grain': 'film-grain 8s steps(1) infinite',
        'slide-in-right': 'slide-in-right 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-out-right': 'slide-out-right 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 200ms ease',
        'expand-down': 'expand-down 200ms ease',
      },
      backgroundImage: {
        'film-grain':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
