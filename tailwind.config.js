/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        // Declared in full, in order. Adding only `xs` under `extend` appends
        // it after lg/xl and reshuffles when each variant applies — that made
        // `lg:` fire at 768px instead of 1024px.
        //
        // `xs` is the width at which the public nav — logo, two links and a
        // button — has room for its full labels; below it they shorten.
        xs: '520px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      colors: {
        // ── Yugam brand (ui.md) ──────────────────────────────────────────
        // Purple runs the interface; gold marks merit and nothing else.
        plum: {
          50: '#F5F1FD',   // selected rows, tinted fills
          100: '#EBE3FA',
          200: '#D9CCF5',
          300: '#BCA5EC',
          400: '#9A77E0',
          500: '#7F4FD3',
          600: '#6D28D9',  // primary buttons, links, focus ring (7.10:1 w/ white)
          700: '#5B21B6',
          800: '#45149B',
          900: '#2E1065',  // nav bar, page headers, footer
        },

        gold: {
          // DECORATIVE ONLY — 2.43:1 on white. Rules, icons, borders.
          500: '#C8A227',
          // The ONLY gold safe for text on light surfaces (4.91:1 on white).
          700: '#8A6D12',
          50: '#FBF4DE',   // merit badge fill
        },

        // Page is a soft warm grey and cards sit a step above it — enough
        // separation to read as raised without a shadow, while staying warm
        // rather than drifting blue. Both hold AA for every token used on
        // them, including gold-700 at 4.70:1.
        paper: '#F3F1ED',  // page background, soft warm grey
        card: '#FBFAF7',   // cards, a touch above the page — not pure white
        // Input fields sit ON a card, so they go the other way: pure white
        // reads as a well set into the surface, which is the correct
        // hierarchy now that cards are no longer white themselves.
        field: '#FFFFFF',
        line: '#E7E3DE',   // hairline borders — these replace shadows
        ink: {
          DEFAULT: '#241F2E',  // body text, faintly purple-cast
          soft: '#5C5566',     // secondary text, labels (6.83:1 on paper)
        },

        // ── Pipeline status ──────────────────────────────────────────────
        // Deliberately not brand colours. Teal deepens as the candidate
        // advances, so progress is legible across a whole list at a glance.
        status: {
          applied: '#F1F5F9',
          'applied-ink': '#475569',
          review: '#E0F2F1',
          'review-ink': '#00695C',
          // Module 2 video screening — one step deeper than review.
          screening: '#C8E6E3',
          'screening-ink': '#00635A',
          short: '#B2DFDB',
          'short-ink': '#00594F',
          interview: '#80CBC4',
          'interview-ink': '#004D40',
          selected: '#DCFCE7',
          'selected-ink': '#166534',
          rejected: '#FEE2E2',
          'rejected-ink': '#991B1B',
        },

        // Institutional portal's original indigo, kept so nothing pre-existing
        // shifts underneath this redesign.
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
        },
      },

      fontFamily: {
        // Literata for headings — institutional warmth without the tuxedo.
        serif: ['Literata', 'Georgia', 'Cambria', 'serif'],
        // IBM Plex Sans for all interface text.
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        /**
         * The spec's scale: 32 / 24 / 20 / 16 / 14 / 13. Nothing below 13.
         *
         * Tracking tightens as size grows — a serif set at 32px needs less
         * space between letters than the same face at 20px, and body text at
         * 16px needs none at all. Line-height loosens as size shrinks, because
         * a 70-character measure at 16px needs more leading to stay readable
         * than a two-word heading does.
         */
        display: ['32px', { lineHeight: '1.18', letterSpacing: '-0.021em' }],
        title: ['24px', { lineHeight: '1.24', letterSpacing: '-0.016em' }],
        heading: ['20px', { lineHeight: '1.32', letterSpacing: '-0.011em' }],
        body: ['16px', { lineHeight: '1.62', letterSpacing: '-0.003em' }],
        ui: ['14px', { lineHeight: '1.5', letterSpacing: '0.006em' }],
        meta: ['13px', { lineHeight: '1.45', letterSpacing: '0.008em' }],
        // Hero only. Literata's opsz opens up properly at this size.
        hero: ['44px', { lineHeight: '1.1', letterSpacing: '-0.026em' }],
      },

      fontWeight: {
        // ui.md allows two weights for hierarchy; 500 exists only to stop
        // 600 being used where it is too heavy (table headers, chip labels).
        normal: '400',
        medium: '500',
        semibold: '600',
      },

      borderRadius: {
        // Radius varies by element type — cards 8, controls 6, badges pill.
        card: '8px',
        control: '6px',
      },

      boxShadow: {
        // Every shadow is tinted with a palette colour (ink #241F2E, plum-600
        // #6D28D9, plum-900 #2E1065) at low alpha — depth without new hues.
        pop: '0 4px 16px -2px rgb(36 31 46 / 0.12), 0 2px 6px -2px rgb(36 31 46 / 0.06)',
        modal: '0 16px 48px -12px rgb(36 31 46 / 0.22)',
        // Resting surfaces: barely there, just enough to lift off the page.
        card: '0 1px 2px rgb(36 31 46 / 0.04), 0 2px 8px -4px rgb(36 31 46 / 0.06)',
        // Hovered interactive surfaces.
        'card-hover': '0 12px 28px -12px rgb(36 31 46 / 0.16), 0 4px 10px -4px rgb(36 31 46 / 0.06)',
        // Primary buttons on hover: a soft plum halo.
        glow: '0 8px 20px -8px rgb(109 40 217 / 0.55)',
        // The plum bar once the page scrolls under it.
        header: '0 10px 30px -12px rgb(46 16 101 / 0.55)',
      },

      maxWidth: {
        // Candidate column, and the 70-character measure for body copy.
        candidate: '640px',
        measure: '70ch',
      },

      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'in-soft': 'cubic-bezier(0.4, 0, 1, 1)',
      },

      transitionDuration: {
        micro: '120ms',
        base: '200ms',
        panel: '320ms',
        moment: '600ms',
      },

      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // The single celebratory beat: a slow gold sweep on "Selected".
        meritSweep: {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)', opacity: '0' },
          '35%': { opacity: '1' },
          '100%': { transform: 'translateX(220%) skewX(-12deg)', opacity: '0' },
        },
      },

      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
        // For elements that are never ancestors of fixed overlays.
        'rise-in': 'rise-in 420ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'merit-sweep': 'meritSweep 600ms cubic-bezier(0.32, 0.72, 0, 1) 1',
      },
    },
  },
  plugins: [],
};
