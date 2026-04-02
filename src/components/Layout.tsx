import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const navItems = [
  { to: '/', label: '~/home' },
  { to: '/graph', label: '~/graph' },
  { to: '/cv', label: '~/cv.pdf' },
  { to: '/resume', label: '~/resume.pdf' },
]

const externalNavItems = [
  { href: 'https://semanticscience.us', label: 'semanticscience.us' },
]

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [theme, toggleTheme] = useTheme()

  return (
    <div className="h-[100dvh] flex flex-col bg-terminal-bg overflow-hidden">
      <nav className="border-b border-terminal-border bg-terminal-surface sticky top-0 z-50">
        <div className="relative">
          <div
            className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-0.5 sm:gap-1 h-9 sm:h-11 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            <span className="text-terminal-green font-bold mr-1.5 sm:mr-3 text-[0.65rem] sm:text-sm text-glow-green tracking-wider flex-shrink-0">
              procko.pro
            </span>
            <span className="text-terminal-muted text-[0.65rem] sm:text-sm mr-1 sm:mr-3 flex-shrink-0">$</span>
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-1.5 sm:px-3 py-0.5 sm:py-1 text-[0.65rem] sm:text-sm rounded transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? 'bg-terminal-border text-terminal-green border border-terminal-green/30 text-glow-green'
                      : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {externalNavItems.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-1.5 sm:px-3 py-0.5 sm:py-1 text-[0.65rem] sm:text-sm rounded transition-all duration-200 text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50 flex-shrink-0"
              >
                {label}
              </a>
            ))}
            {/* Spacer */}
            <div className="flex-1 min-w-0" />
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle light/dark mode"
              className="flex-shrink-0 ml-1 sm:ml-2 px-1.5 py-0.5 sm:py-1 text-[0.65rem] sm:text-sm rounded transition-all duration-200 text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
          {/* Scroll fade indicator — mobile only */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:hidden"
            style={{ background: 'linear-gradient(to right, transparent, rgb(var(--color-terminal-surface)))' }}
          />
        </div>
      </nav>
      <div className="bg-red-950/60 border-b border-red-500/40 px-2 py-0.5 sm:px-3 sm:py-1.5 text-center font-mono text-[0.55rem] sm:text-xs text-red-400/90 tracking-wide">
        ⚠ under construction — content and features are incomplete
      </div>
      <main className="flex-1 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  )
}
