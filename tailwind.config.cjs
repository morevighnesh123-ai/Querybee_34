/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        qb: 'var(--qb-radius, 18px)',
      },
      colors: {
        qb: {
          bg: 'hsl(var(--qb-bg))',
          fg: 'hsl(var(--qb-fg))',
          card: 'hsl(var(--qb-card))',
          border: 'hsl(var(--qb-border))',
          accent: 'hsl(var(--qb-accent))',
          accentFg: 'hsl(var(--qb-accent-fg))',
          muted: 'hsl(var(--qb-muted))',
          mutedFg: 'hsl(var(--qb-muted-fg))',
        },
      },
      boxShadow: {
        qb: '0 20px 60px rgba(0,0,0,0.22)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [require('tailwindcss-animate')],
};
