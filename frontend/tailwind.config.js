/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        navy: {
          DEFAULT: '#1B3A5C',
          50: '#EEF2F7',
          100: '#D6DFEB',
          200: '#AEC1D6',
          300: '#7E9BBC',
          400: '#4E739F',
          500: '#2E5F8A',
          600: '#1B3A5C',
          700: '#142C46',
          800: '#0F2238',
          900: '#091628',
        },
        gold: {
          DEFAULT: '#D4A853',
          50: '#FBF6EA',
          100: '#F6EAC8',
          200: '#ECD491',
          300: '#E1BD5C',
          400: '#D4A853',
          500: '#B98A35',
          600: '#8E6926',
          700: '#65491A',
        },
        surface: {
          DEFAULT: '#F8F7F4',
          card: '#FFFFFF',
          muted: '#F1EFEA',
        },
        ink: {
          DEFAULT: '#1A1A2E',
          secondary: '#5A6070',
          muted: '#8B91A1',
        },
        line: '#E2DDD6',
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
        success: {
          DEFAULT: '#2D7A4F',
          foreground: '#FFFFFF',
          soft: '#E6F2EC',
        },
        warning: {
          DEFAULT: '#C17B2A',
          foreground: '#FFFFFF',
          soft: '#FAEFD9',
        },
        danger: {
          DEFAULT: '#B03A2E',
          foreground: '#FFFFFF',
          soft: '#F8E1DE',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: '#1B3A5C',
          2: '#D4A853',
          3: '#2D7A4F',
          4: '#C17B2A',
          5: '#5A6070',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,34,56,0.06), 0 1px 3px rgba(15,34,56,0.04)',
        card: '0 4px 14px rgba(15,34,56,0.06), 0 1px 3px rgba(15,34,56,0.04)',
        modal: '0 24px 48px -12px rgba(15,34,56,0.18)',
        gold: '0 8px 24px -8px rgba(212,168,83,0.45)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
