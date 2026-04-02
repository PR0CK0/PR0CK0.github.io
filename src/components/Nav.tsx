type Tab =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'publications'
  | 'awards'
  | 'certificates'
  | 'graph'

export const TABS: { id: Tab; label: string }[] = [
  { id: 'summary',      label: 'Summary' },
  { id: 'experience',   label: 'Work Experience' },
  { id: 'education',    label: 'Education' },
  { id: 'skills',       label: 'Skills' },
  { id: 'projects',     label: 'Projects (Top 8)' },
  { id: 'publications', label: 'Selected Publications (Top 10, Published)' },
  { id: 'awards',       label: 'Awards & Honors' },
  { id: 'certificates', label: 'Certifications' },
  { id: 'graph',        label: 'Knowledge Graph' },
]

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function Nav({ active, onChange }: Props) {
  return (
    <nav className="sticky top-0 z-50 bg-terminal-bg border-b border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'whitespace-nowrap px-3 py-1 rounded text-xs font-mono border transition-all duration-200',
              active === tab.id
                ? 'border-terminal-green text-terminal-green text-glow-green bg-terminal-green/10'
                : 'border-transparent text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export type { Tab }
