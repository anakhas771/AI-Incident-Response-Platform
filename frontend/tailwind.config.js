/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Surface system
        surface: {
          DEFAULT: '#0d0e12',
          elevated: '#111318',
          hover: '#181b22',
        },
        subtle: 'rgba(255, 255, 255, 0.07)',

        // Semantic accent colors
        soc: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#f59e0b',
          low: '#10b981',
          ai: '#6366f1',
          telemetry: '#22d3ee',
          healthy: '#10b981',
          warning: '#f59e0b',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      boxShadow: {
        'card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.35)',
        'critical': '0 0 20px -4px rgba(239, 68, 68, 0.3)',
        'ai': '0 0 24px -6px rgba(99, 102, 241, 0.35)',
        'glow-indigo': '0 0 20px -5px rgba(99, 102, 241, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(34, 211, 238, 0.3)',
      },

      animation: {
        'shimmer': 'shimmer 1.4s ease-in-out infinite',
        'stream-pulse': 'stream-pulse 1.5s ease-in-out infinite',
        'live-blink': 'live-blink 2s ease-in-out infinite',
        'critical-glow': 'critical-glow-pulse 2.5s ease-in-out infinite',
        'fade-up': 'fade-in-up 0.4s ease-out both',
        'critical-pulse': 'pulse-critical 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'stream-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        'live-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'critical-glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
          '50%': { boxShadow: '0 0 20px -4px rgba(239, 68, 68, 0.25)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-critical': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
