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
    <div className="min-h-screen flex flex-col bg-terminal-bg">
      <nav className="border-b border-terminal-border bg-terminal-surface sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-12 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-terminal-green font-bold mr-3 text-sm text-glow-green tracking-wider">
            procko.pro
          </span>
          <span className="text-terminal-muted text-sm mr-3">$</span>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1 text-sm rounded transition-all duration-200 ${
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
              className="px-3 py-1 text-sm rounded transition-all duration-200 text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
