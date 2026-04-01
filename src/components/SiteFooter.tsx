import { useMemo } from 'react'

export default function SiteFooter({ name }: { name: string }) {
  const buildStr = useMemo(() => {
    try {
      return new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return '' }
  }, [])

  return (
    <footer className="border-t border-terminal-border bg-terminal-surface/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[0.55rem] sm:text-[0.63rem] font-mono text-terminal-muted text-center sm:text-left">
            <span className="text-terminal-green">procko.pro</span>
            {' · '}built with{' '}
            <span className="text-terminal-amber">YAML</span>
            {' + '}
            <span className="text-terminal-purple">React</span>
            {' + '}
            <span className="text-terminal-blue">Cytoscape</span>
          </p>
          <nav className="flex flex-wrap justify-center gap-3 sm:gap-5 text-[0.55rem] sm:text-[0.63rem] font-mono text-terminal-muted">
            {[
              { label: '~/graph', href: '/graph' },
              { label: '~/cv', href: '/cv' },
              { label: '~/resume', href: '/resume' },
              { label: '~/legacy', href: '/legacy' },
              { label: '~/about', href: '/about' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hover:text-terminal-green transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-terminal-border/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-terminal-muted/40 text-[7px] sm:text-[8px] font-mono">
          <span className="flex items-center gap-2">
            <span className="animate-blink">▮</span>
            <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-terminal-green/30">commit</span>
            <a
              href={`https://github.com/PR0CK0/PR0CK0.github.io/commit/${__GIT_COMMIT__}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-green/50 hover:text-terminal-green transition-colors"
            >
              {__GIT_COMMIT__}
            </a>
            <span className="text-terminal-muted/30">·</span>
            <span>updated {buildStr}</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
