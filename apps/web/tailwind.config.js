export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          foreground: '#ffffff',
          hover: '#0D9488',
          light: '#14B8A6',
        },
        secondary: {
          DEFAULT: '#F0FDF4',
          foreground: '#166534',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#ffffff',
        },
        success: '#10B981',
        warning: '#F59E0B',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        foreground: '#1E293B',
        'foreground-muted': '#64748B',
        border: '#E2E8F0',
        input: '#E2E8F0',
        avatar: {
          blue: '#3B82F6',
          green: '#10B981',
          violet: '#8B5CF6',
          orange: '#F97316',
          red: '#EF4444',
          pink: '#EC4899',
          gray: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};