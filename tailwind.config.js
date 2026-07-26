/** @type {import('tailwindcss').Config} */

// Every colour resolves to a CSS custom property defined in src/index.css, so
// the same utility classes (bg-surface, text-muted, …) theme themselves in dark
// mode with no per-component changes.
const t = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: t('--c-bg'),
        bgtint: t('--c-bgtint'),
        surface: t('--c-surface'),
        surface2: t('--c-surface2'),
        ink: t('--c-ink'),
        muted: t('--c-muted'),
        faint: t('--c-faint'),
        line: t('--c-line'),
        line2: t('--c-line2'),
        slateSoft: t('--c-slate-soft'),

        accent: { DEFAULT: t('--c-accent'), deep: t('--c-accent-deep'), soft: t('--c-accent-soft'), fill: t('--c-accent-fill') },
        good: { DEFAULT: t('--c-good'), deep: t('--c-good-deep'), soft: t('--c-good-soft'), fill: t('--c-good-fill') },
        warn: { DEFAULT: t('--c-warn'), deep: t('--c-warn-deep'), soft: t('--c-warn-soft'), fill: t('--c-warn-fill') },
        ai: { DEFAULT: t('--c-ai'), deep: t('--c-ai-deep'), soft: t('--c-ai-soft'), fill: t('--c-ai-fill') },
        danger: { DEFAULT: t('--c-danger'), deep: t('--c-danger-deep'), soft: t('--c-danger-soft'), fill: t('--c-danger-fill') },

        // dark chips / tooltips / overlays — always light text on top
        inverse: { DEFAULT: t('--c-inverse'), fg: t('--c-inverse-fg') },
        scrim: t('--c-scrim'),
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      // Semantic type scale — replaces ad-hoc text-[13.5px] literals.
      fontSize: {
        micro: ['11px', { lineHeight: '1.45' }],
        meta: ['12px', { lineHeight: '1.5' }],
        body: ['13px', { lineHeight: '1.55' }],
        lead: ['14px', { lineHeight: '1.55' }],
        title: ['17px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        display: ['21px', { lineHeight: '1.22', letterSpacing: '-0.02em' }],
        hero: ['28px', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
      },
      borderRadius: { xl2: '14px', xl3: '20px' },
      boxShadow: {
        e1: '0 1px 2px rgb(var(--shadow-rgb) / var(--shadow-a1))',
        e2: '0 1px 2px rgb(var(--shadow-rgb) / var(--shadow-a1)), 0 6px 18px rgb(var(--shadow-rgb) / var(--shadow-a2))',
        e3: '0 16px 40px rgb(var(--shadow-rgb) / var(--shadow-a3))',
        // legacy aliases kept so existing screens don't need touching
        soft: '0 1px 2px rgb(var(--shadow-rgb) / var(--shadow-a1)), 0 6px 18px rgb(var(--shadow-rgb) / var(--shadow-a2))',
        pop: '0 16px 40px rgb(var(--shadow-rgb) / var(--shadow-a3))',
        glow: '0 0 0 3px rgb(var(--c-accent) / .18)',
        brand: '0 8px 24px rgb(var(--c-accent-fill) / .28)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'none' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgb(var(--c-accent) / .45)' }, '100%': { boxShadow: '0 0 0 12px rgb(var(--c-accent) / 0)' } },
        flash: { '0%,100%': { background: 'transparent' }, '30%': { background: 'rgb(var(--c-good) / .16)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        barSlide: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        fade: 'fadeUp .22s cubic-bezier(.2,.7,.3,1) both',
        pulsering: 'pulseRing .9s ease-out',
        flash: 'flash 1.1s ease-out',
        barslide: 'barSlide .9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
