import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: '~/home' },
  { to: '/graph', label: '~/graph' },
  { to: '/cv', label: '~/cv.pdf' },
  { to: '/resume', label: '~/resume.pdf' },
  { to: '/legacy', label: '~/legacy' },
]

const externalNavItems = [
  { href: 'https://semanticscience.us', label: 'semanticscience.us' },
]

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      <nav className="border-b border-terminal-border bg-terminal-surface sticky top-0 z-50">
        <div className="relative">
          <div
            className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-0.5 sm:gap-1 h-10 sm:h-12 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            <span className="text-terminal-green font-bold mr-2 sm:mr-3 text-xs sm:text-sm text-glow-green tracking-wider flex-shrink-0">
              procko.pro
            </span>
            <span className="text-terminal-muted text-xs sm:text-sm mr-1 sm:mr-3 flex-shrink-0">$</span>
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded transition-all duration-200 flex-shrink-0 ${
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
                className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded transition-all duration-200 text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50 flex-shrink-0"
              >
                {label}
              </a>
            ))}
          </div>
          {/* Scroll fade indicator — mobile only */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:hidden"
            style={{ background: 'linear-gradient(to right, transparent, #0f1629)' }}
          />
        </div>
      </nav>
      <div className="bg-red-950/60 border-b border-red-500/40 px-3 py-1 sm:py-1.5 text-center font-mono text-[0.65rem] sm:text-xs text-red-400/90 tracking-wide">
        ⚠ under construction — content and features are incomplete
      </div>
      <main className="flex-1 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  )
}
