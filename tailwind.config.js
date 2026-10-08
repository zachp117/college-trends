/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Brand type: Space Grotesk for UI + headlines, Space Mono for // labels and data.
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', '"SF Mono"', 'monospace'],
      },
      // Shadows tinted toward brand ink-navy instead of neutral black.
      boxShadow: {
        sm: '0 1px 2px rgba(15, 34, 55, 0.05)',
        DEFAULT: '0 1px 3px rgba(15, 34, 55, 0.07), 0 1px 2px rgba(15, 34, 55, 0.04)',
        md: '0 6px 16px -4px rgba(15, 34, 55, 0.10), 0 2px 4px rgba(15, 34, 55, 0.04)',
        lg: '0 14px 32px -8px rgba(15, 34, 55, 0.14), 0 4px 8px rgba(15, 34, 55, 0.04)',
        xl: '0 24px 48px -12px rgba(15, 34, 55, 0.20)',
      },
      colors: {
        // Brand accent: remap the app's existing `indigo-*` accent scale to the
        // CollegeTrends signal-cyan family. Kept deep enough that white button
        // text and link text stay readable on light surfaces. Anchored on the
        // brand --ct-signal-cyan (#2EB4F0), which lives at the 400/500 tints.
        indigo: {
          50: '#eaf6fd',
          100: '#ccecfb',
          200: '#9fdaf6',
          300: '#6ecbf2',
          400: '#33b4ea',
          500: '#0c7cbe',
          600: '#0a6aa8',
          700: '#085788',
          800: '#0a4667',
          900: '#0b3450',
          950: '#07283e',
        },
      },
      // Brand geometry: slightly softer corners than Tailwind's defaults
      // (brand spec is 10 / 16 / 20; tuned down a touch for data-dense cards).
      borderRadius: {
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
    },
  },
  plugins: [],
};
