import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        terminal: {
          bg:      'rgb(var(--color-terminal-bg)      / <alpha-value>)',
          surface: 'rgb(var(--color-terminal-surface) / <alpha-value>)',
          border:  'rgb(var(--color-terminal-border)  / <alpha-value>)',
          green:   'rgb(var(--color-terminal-green)   / <alpha-value>)',
          amber:   'rgb(var(--color-terminal-amber)   / <alpha-value>)',
          blue:    'rgb(var(--color-terminal-blue)    / <alpha-value>)',
          purple:  'rgb(var(--color-terminal-purple)  / <alpha-value>)',
          red:     'rgb(var(--color-terminal-red)     / <alpha-value>)',
          text:    'rgb(var(--color-terminal-text)    / <alpha-value>)',
          muted:   'rgb(var(--color-terminal-muted)   / <alpha-value>)',
        },
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 8s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glow-pulse': {
          '0%, 100%': { textShadow: '0 0 8px #00ff88, 0 0 16px #00ff88' },
          '50%': { textShadow: '0 0 16px #00ff88, 0 0 32px #00ff88, 0 0 48px #00ff88' },
        },
      },
    },
  },
  plugins: [
    // ls: = landscape phone (wide but short — orientation:landscape + max-height:500px)
    // Use alongside sm: to prevent upscaling on rotated phones
    plugin(({ addVariant }) => {
      addVariant('ls', '@media (orientation: landscape) and (max-height: 500px)')
    }),
  ],
}

export default config
