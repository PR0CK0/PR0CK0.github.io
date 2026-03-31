import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'
import { loadPortfolioData } from '@/lib/yaml-loader'
import { TECH_CATEGORIES, type SkillCategory } from '@/lib/tech-categories'
import type { Person, Publication, Project } from '@/lib/schema'

// ─── Boot sequence lines ───────────────────────────────────────────────────
function buildBootLines(pubCount: number) {
  return [
    { prefix: '>', text: 'initializing procko.pro...' },
    { prefix: '>', text: 'loading knowledge graph engine...' },
    { prefix: '>', text: `deploying agent swarm...` },
{ prefix: '>', text: 'status: AVAILABLE' },
  ]
}
type BootLine = ReturnType<typeof buildBootLines>[number]

// ─── Stats ─────────────────────────────────────────────────────────────────
function buildStats(pubCount: number, projCount: number) {
  return [
    { label: 'Degree', value: 'Ph.D. EECS' },
    { label: 'Publications', value: `${pubCount}` },
    { label: 'Java / Python', value: '9+ yrs' },
    { label: 'Projects', value: `${projCount}` },
    { label: 'AFRL Clearance', value: 'SECRET' },
    { label: 'Certified', value: 'Google + Stanford' },
  ]
}
type Stat = ReturnType<typeof buildStats>[number]

// ─── Category meta ─────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; color: string; chipClass: string }> = {
  prog_languages: {
    label: 'Programming Languages',
    color: 'text-terminal-green',
    chipClass:
      'border border-terminal-green/30 text-terminal-green bg-terminal-green/5 hover:bg-terminal-green/15 hover:border-terminal-green/60',
  },
  data_languages: {
    label: 'Data Languages',
    color: 'text-emerald-400',
    chipClass:
      'border border-emerald-400/30 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/15 hover:border-emerald-400/60',
  },
  libraries: {
    label: 'Libraries',
    color: 'text-terminal-blue',
    chipClass:
      'border border-terminal-blue/30 text-terminal-blue bg-terminal-blue/5 hover:bg-terminal-blue/15 hover:border-terminal-blue/60',
  },
  dev_tools: {
    label: 'Development Tools',
    color: 'text-terminal-purple',
    chipClass:
      'border border-terminal-purple/30 text-terminal-purple bg-terminal-purple/5 hover:bg-terminal-purple/15 hover:border-terminal-purple/60',
  },
  office_tools: {
    label: 'Office Tools',
    color: 'text-orange-400',
    chipClass:
      'border border-orange-400/30 text-orange-400 bg-orange-400/5 hover:bg-orange-400/15 hover:border-orange-400/60',
  },
  comm_tools: {
    label: 'Communication Tools',
    color: 'text-pink-400',
    chipClass:
      'border border-pink-400/30 text-pink-400 bg-pink-400/5 hover:bg-pink-400/15 hover:border-pink-400/60',
  },
  ai_tools: {
    label: 'AI / ML',
    color: 'text-terminal-amber',
    chipClass:
      'border border-terminal-amber/30 text-terminal-amber bg-terminal-amber/5 hover:bg-terminal-amber/15 hover:border-terminal-amber/60',
  },
  vocabularies: {
    label: 'Ontologies & Vocabularies',
    color: 'text-cyan-400',
    chipClass:
      'border border-cyan-400/30 text-cyan-400 bg-cyan-400/5 hover:bg-cyan-400/15 hover:border-cyan-400/60',
  },
  cloud: {
    label: 'Cloud & Deployment',
    color: 'text-sky-400',
    chipClass:
      'border border-sky-400/30 text-sky-400 bg-sky-400/5 hover:bg-sky-400/15 hover:border-sky-400/60',
  },
  os: {
    label: 'Operating Systems',
    color: 'text-slate-400',
    chipClass:
      'border border-slate-400/30 text-slate-400 bg-slate-400/5 hover:bg-slate-400/15 hover:border-slate-400/60',
  },
  design: {
    label: 'Design & Analysis',
    color: 'text-rose-400',
    chipClass:
      'border border-rose-400/30 text-rose-400 bg-rose-400/5 hover:bg-rose-400/15 hover:border-rose-400/60',
  },
  soft_skills: {
    label: 'Soft Skills',
    color: 'text-yellow-400',
    chipClass:
      'border border-yellow-400/30 text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400/15 hover:border-yellow-400/60',
  },
  personal: {
    label: 'Personal',
    color: 'text-fuchsia-400',
    chipClass:
      'border border-fuchsia-400/30 text-fuchsia-400 bg-fuchsia-400/5 hover:bg-fuchsia-400/15 hover:border-fuchsia-400/60',
  },
  paradigms: {
    label: 'Research Domains',
    color: 'text-indigo-400',
    chipClass:
      'border border-indigo-400/30 text-indigo-400 bg-indigo-400/5 hover:bg-indigo-400/15 hover:border-indigo-400/60',
  },
}

const SHOWN_CATEGORIES = [
  'prog_languages', 'data_languages', 'libraries', 'dev_tools', 'office_tools', 'comm_tools',
  'ai_tools', 'vocabularies', 'cloud', 'os', 'design', 'soft_skills', 'personal', 'paradigms',
]

// ─── Helpers ───────────────────────────────────────────────────────────────
function statusBadge(status?: string) {
  if (!status) return null
  const map: Record<string, { label: string; cls: string }> = {
    published: { label: 'published', cls: 'border-terminal-green/40 text-terminal-green bg-terminal-green/10' },
    awaiting_publication: { label: 'awaiting', cls: 'border-terminal-amber/40 text-terminal-amber bg-terminal-amber/10' },
    in_progress: { label: 'in progress', cls: 'border-terminal-muted/40 text-terminal-muted bg-terminal-muted/10' },
  }
  const m = map[status]
  if (!m) return null
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-mono border ${m.cls} whitespace-nowrap`}>
      {m.label}
    </span>
  )
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(date?: string) {
  if (!date) return '—'
  const [year, month] = date.split('-')
  const m = parseInt(month, 10)
  return (m >= 1 && m <= 12) ? `${MONTHS[m - 1]} ${year}` : year
}

// ─── Profile Photo ──────────────────────────────────────────────────────────

function ProfilePhoto({ visible }: { visible: boolean }) {
  return (
    <div
      className="flex-shrink-0 relative w-[66px] h-[66px] sm:w-[101px] sm:h-[101px] ls:w-[66px] ls:h-[66px]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.1s' }}
    >
      {/* Scan-reveal container */}
      <div
        className={`relative rounded-full overflow-hidden w-full h-full ${visible ? 'profile-scan-reveal' : ''}`}
        style={{ clipPath: visible ? undefined : 'inset(0 0 100% 0)' }}
      >
        <img
          src="/me.png"
          alt="Tyler Procko"
          className="w-full h-full object-cover rounded-full"
          draggable={false}
        />
        {/* CRT scanlines overlay on photo */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
          }}
        />
      </div>

      {/* Electric border ring */}
      {visible && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none profile-electric"
          style={{ border: '1.5px solid #00ff8877' }}
        />
      )}

      {/* Scan line that sweeps down during reveal */}
      {visible && (
        <div
          className="absolute left-0 right-0 h-px rounded-full pointer-events-none profile-scan-line"
          style={{
            background: 'linear-gradient(90deg, transparent, #00ff88, #00d4ff, #00ff88, transparent)',
            boxShadow: '0 0 8px 2px #00ff88, 0 0 16px 4px #00d4ff44',
            zIndex: 10,
          }}
        />
      )}

      {/* Corner brackets — techy frame */}
      {visible && (
        <>
          {[['top-0 left-0', 'border-t border-l'], ['top-0 right-0', 'border-t border-r'],
            ['bottom-0 left-0', 'border-b border-l'], ['bottom-0 right-0', 'border-b border-r']].map(([pos, borders], i) => (
            <div
              key={i}
              className={`absolute w-3 h-3 ${pos} ${borders} pointer-events-none`}
              style={{ borderColor: '#00ff8888' }}
            />
          ))}
        </>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SocialButton({ label, href, icon }: { label: string; href: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 sm:gap-2 ls:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 ls:px-2 ls:py-1 rounded-full border border-terminal-border
                 text-terminal-muted hover:text-terminal-green hover:border-terminal-green/50
                 hover:bg-terminal-green/5 transition-all duration-200 text-[0.65rem] sm:text-xs ls:text-[0.65rem] font-mono"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  )
}

function CtaButton({
  children,
  onClick,
  variant = 'green',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'green' | 'blue'
}) {
  const cls =
    variant === 'green'
      ? 'border-terminal-green/60 text-terminal-green hover:bg-terminal-green hover:text-terminal-bg border-glow-green'
      : 'border-terminal-blue/60 text-terminal-blue hover:bg-terminal-blue hover:text-terminal-bg border-glow-blue'
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 sm:px-5 sm:py-2 ls:px-3 ls:py-1.5 rounded border font-mono text-xs sm:text-sm ls:text-xs transition-all duration-200 ${cls}`}
    >
      {children}
    </button>
  )
}

// ─── Hero / Boot Section ────────────────────────────────────────────────────

// ─── Redacted commit messages ───────────────────────────────────────────────

const REDACTED_MSGS = [
  'hidden for your safety',
  '[REDACTED] — clearance required',
  'access denied: need-to-know basis',
  'this one stays classified',
  'eyes only',
  'details withheld by request of the shadow council',
  'you didn\'t see anything',
  'memory wiped',
  '[ERROR] timestamp predates your clearance level',
  'nothing to see here. move along.',
]

// ─── Typing Prompt ──────────────────────────────────────────────────────────

const PROMPT_QUERIES = [
  'tell me about tyler',
  'who is tyler procko?',
  'list publications --recent',
  'grep -r "ontology" ./research/',
  'git log --author=tyler --oneline',
  'cat resume.pdf | summarize',
  'describe tyler procko --verbose',
  'ssh procko@agent-swarm.local',
  'python3 deploy_agents.py',
  'curl procko.pro/api/knowledge-graph',
  './run_knowledge_graph.sh',
  'find . -name "*.owl" | wc -l',
]

type TypingState = 'waiting' | 'typing' | 'pausing' | 'deleting'

function TypingPrompt({ onFirstTyped }: { onFirstTyped?: () => void }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<TypingState>('waiting')
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    const clear = () => { if (timer.current) clearTimeout(timer.current) }
    const query = PROMPT_QUERIES[idx]

    if (phase === 'waiting') {
      timer.current = setTimeout(() => {
        setIdx(Math.floor(Math.random() * PROMPT_QUERIES.length))
        setPhase('typing')
      }, 600)
    } else if (phase === 'typing') {
      if (text.length < query.length) {
        timer.current = setTimeout(() => {
          setText(query.slice(0, text.length + 1))
        }, 37 + Math.random() * 43)
      } else {
        if (!firedRef.current) {
          firedRef.current = true
          onFirstTyped?.()
        }
        timer.current = setTimeout(() => setPhase('pausing'), 1467 + Math.random() * 533)
      }
    } else if (phase === 'pausing') {
      timer.current = setTimeout(() => setPhase('deleting'), 80)
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timer.current = setTimeout(() => {
          setText((t) => t.slice(0, -1))
        }, 19 + Math.random() * 12)
      } else {
        // Pick a different query next time
        setIdx((i) => (i + 1 + Math.floor(Math.random() * (PROMPT_QUERIES.length - 1))) % PROMPT_QUERIES.length)
        setPhase('waiting')
      }
    }

    return clear
  }, [phase, text, idx, onFirstTyped])

  return (
    <div className="flex gap-2 items-center font-mono text-xs sm:text-sm ls:text-xs">
      <span className="text-terminal-green select-none">$</span>
      <span className="text-terminal-amber">{text}</span>
      <span className="animate-blink text-terminal-green leading-none">▮</span>
    </div>
  )
}

// ─── Boot Sequence ───────────────────────────────────────────────────────────

function BootSequence({ lines, onComplete, onFirstTyped }: { lines: BootLine[]; onComplete: () => void; onFirstTyped: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [showCursor, setShowCursor] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visibleLines < lines.length) {
      timerRef.current = setTimeout(() => {
        setVisibleLines((v) => v + 1)
      }, 120)
    } else {
      timerRef.current = setTimeout(() => {
        setShowCursor(true)
        timerRef.current = setTimeout(() => {
          onComplete()
        }, 267)
      }, 67)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visibleLines, lines, onComplete])

  return (
    <div className="font-mono text-xs sm:text-sm ls:text-xs space-y-1">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={i < visibleLines ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          className="flex gap-2"
        >
          <span className="text-terminal-green select-none">{line.prefix}</span>
          <span className="text-terminal-text">{line.text}</span>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: showCursor ? 1 : 0 }}>
        <TypingPrompt onFirstTyped={onFirstTyped} />
      </motion.div>
    </div>
  )
}

function HeroContent({ person }: { person: Person }) {
  const navigate = useNavigate()

  const socialMeta: Record<string, { icon: string; label: string }> = {
    GitHub: { icon: '⌥', label: 'GitHub' },
    LinkedIn: { icon: '⊞', label: 'LinkedIn' },
    'Google Scholar': { icon: '◎', label: 'Scholar' },
    ORCiD: { icon: '◈', label: 'ORCiD' },
    Substack: { icon: '✉', label: 'Substack' },
  }

  const socials = (person.social_links ?? []).filter((s) =>
    ['GitHub', 'LinkedIn', 'Google Scholar', 'ORCiD', 'Substack'].includes(s.platform)
  )

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-3 sm:mt-8 ls:mt-3 space-y-2 sm:space-y-3 ls:space-y-2"
    >
      {/* Name */}
      <motion.h1
        variants={itemVariants}
        className="text-xl sm:text-4xl lg:text-5xl ls:text-xl font-mono font-bold tracking-widest
                   text-terminal-green text-glow-green animate-glow-pulse"
      >
        {person.name.toUpperCase()}
      </motion.h1>

      {/* Title */}
      <motion.p
        variants={itemVariants}
        className="text-terminal-blue text-glow-blue font-mono text-xs sm:text-base ls:text-xs tracking-wide"
      >
        AI Engineer — Agentic LLMs · Knowledge Graphs · Ontologies
      </motion.p>

      {/* Tagline */}
      <motion.p
        variants={itemVariants}
        className="italic text-terminal-muted font-mono text-[0.7rem] sm:text-sm ls:text-[0.7rem]"
      >
        &quot;{person.tagline ?? 'Casting the net for knowledge in a sea of infinite information.'}&quot;
      </motion.p>

      {/* Social links */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-1.5 sm:gap-2 ls:gap-1.5">
        {socials.map((s) => {
          const meta = socialMeta[s.platform] ?? { icon: '→', label: s.platform }
          return <SocialButton key={s.id} label={meta.label} href={s.url} icon={meta.icon} />
        })}
      </motion.div>

      {/* CTA buttons */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2 sm:gap-3 ls:gap-2 pt-1 sm:pt-2 ls:pt-1">
        <CtaButton variant="green" onClick={() => navigate('/graph')}>
          ~/graph →
        </CtaButton>
        <CtaButton variant="blue" onClick={() => navigate('/cv')}>
          ~/cv.pdf →
        </CtaButton>
      </motion.div>
    </motion.div>
  )
}

function HeroSection({ person, bootLines }: { person: Person; bootLines: BootLine[] }) {
  const [bootDone, setBootDone] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)

  return (
    <section className="relative overflow-hidden bg-terminal-bg">
      {/* Scanlines overlay */}
      <div className="scanlines absolute inset-0 z-10 pointer-events-none" />

      {/* Subtle grid bg */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#4d9fff 1px, transparent 1px), linear-gradient(90deg, #4d9fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
        {/* Terminal window chrome */}
        <div className="rounded-lg border border-terminal-border bg-terminal-surface/60 backdrop-blur-sm overflow-hidden shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 ls:gap-1.5 px-3 sm:px-4 ls:px-3 py-1.5 sm:py-2 ls:py-1.5 border-b border-terminal-border bg-terminal-bg/80">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 ls:w-2.5 ls:h-2.5 rounded-full bg-terminal-red/70" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 ls:w-2.5 ls:h-2.5 rounded-full bg-terminal-amber/70" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 ls:w-2.5 ls:h-2.5 rounded-full bg-terminal-green/70" />
            <span className="ml-2 sm:ml-3 ls:ml-2 text-terminal-muted text-[0.6rem] sm:text-xs ls:text-[0.6rem] font-mono tracking-widest">
              procko@portfolio ~ bash
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-4 sm:p-6 lg:p-8 ls:p-4">
            {/* Photo floated right — boot lines wrap beside it; content below clears to full width */}
            <div className="float-right ml-3 sm:ml-5 ls:ml-3 mt-1">
              <ProfilePhoto visible={heroVisible} />
            </div>

            <BootSequence
              lines={bootLines}
              onComplete={() => setBootDone(true)}
              onFirstTyped={() => setHeroVisible(true)}
            />

            <motion.div
              animate={{ opacity: heroVisible ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              style={{ pointerEvents: heroVisible ? 'auto' : 'none' }}
            >
              <HeroContent person={person} />
            </motion.div>

            <div className="clear-both" />
          </div>
        </div>

        {/* Scroll hint */}
        {heroVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex justify-center mt-3"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="text-terminal-muted text-[0.6rem] sm:text-xs font-mono flex flex-col items-center gap-0.5 sm:gap-1"
            >
              <span>scroll</span>
              <span>↓</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <section className="border-y border-terminal-border bg-terminal-surface/40 overflow-hidden">
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-terminal-border">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="flex flex-col items-center px-1 sm:px-5 ls:px-2 py-2 sm:py-4 ls:py-3"
          >
            <span className="text-sm sm:text-xl ls:text-lg font-mono font-bold text-terminal-green text-glow-green text-center">
              {s.value}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-terminal-muted mt-1 tracking-widest uppercase text-center">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── Skills Matrix ─────────────────────────────────────────────────────────

type AggregatedSkill = { name: string; count: number; category: SkillCategory }

function aggregateSkills(person: Person): AggregatedSkill[] {
  const skillMap = new Map<string, { count: number; category: SkillCategory }>()

  const add = (name: string, category: SkillCategory) => {
    const e = skillMap.get(name)
    if (e) e.count++
    else skillMap.set(name, { count: 1, category })
  }

  const entities = [
    ...(person.projects ?? []),
    ...(person.work_experiences ?? []),
    ...(person.courses ?? []),
    ...(person.extracurriculars ?? []),
    ...(person.publications ?? []),
    ...(person.talks ?? []),
  ] as Array<{
    technologies?: string[]
    domains?: string[]
    soft_skills?: string[]
    personal_skills?: string[]
  }>

  for (const e of entities) {
    for (const t of e.technologies ?? []) {
      const cat = TECH_CATEGORIES[t]
      if (cat) add(t, cat)
    }
    for (const d of e.domains ?? [])        add(d, 'paradigms')
    for (const s of e.soft_skills ?? [])    add(s, 'soft_skills')
    for (const p of e.personal_skills ?? []) add(p, 'personal')
  }

  return Array.from(skillMap.entries()).map(([name, { count, category }]) => ({ name, count, category }))
}

function SkillChip({ skill, chipClass, opacity }: { skill: AggregatedSkill; chipClass: string; opacity: number }) {
  const navigate = useNavigate()
  return (
    <motion.span
      whileHover={{ scale: 1.05, opacity: 1 }}
      onClick={() => navigate(`/graph?q=${encodeURIComponent(skill.name)}`)}
      className={`inline-flex items-center gap-1 sm:gap-1 ls:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 ls:px-1.5 ls:py-0.5 rounded text-[0.55rem] sm:text-[0.68rem] ls:text-[0.55rem] font-mono
                  transition-all duration-150 cursor-pointer ${chipClass}`}
      style={{ opacity }}
    >
      {skill.name}
      {skill.count > 1 && (
        <span className="opacity-50 text-[9px]">×{skill.count}</span>
      )}
    </motion.span>
  )
}

// ─── View toggle ────────────────────────────────────────────────────────────

type SkillView = 'categories' | 'ranked'

function ViewToggle({ view, onChange }: { view: SkillView; onChange: (v: SkillView) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-terminal-border bg-terminal-surface/40 p-0.5 gap-0.5 font-mono text-[0.55rem] sm:text-[0.68rem] ls:text-[0.55rem] relative">
      {(['ranked', 'categories'] as SkillView[]).map((v) => {
        const active = view === v
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="relative px-2 py-0.5 sm:px-2.5 sm:py-1 ls:px-2 ls:py-0.5 rounded-md transition-colors duration-200 z-10"
            style={{ color: active ? '#b57bff' : '#4a5a7a' }}
          >
            {active && (
              <motion.span
                layoutId="skill-view-pill"
                className="absolute inset-0 rounded-md bg-terminal-purple/15 border border-terminal-purple/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {v === 'categories' ? '// by category' : '# ranked by use'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Ranked view ─────────────────────────────────────────────────────────────

const RANKED_PAGE = 30

function RankedView({ skills }: { skills: AggregatedSkill[] }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = [...skills].sort((a, b) => b.count - a.count)
  const maxCount = sorted[0]?.count ?? 1
  const visible = expanded ? sorted : sorted.slice(0, RANKED_PAGE)
  const hidden = sorted.length - RANKED_PAGE

  return (
    <motion.div
      key="ranked"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-wrap gap-1 sm:gap-1.5 ls:gap-1">
        {visible.map((sk, i) => {
          const meta = CATEGORY_META[sk.category]
          const opacity = Math.max(0.4, Math.pow(sk.count / maxCount, 0.35))
          return (
            <motion.div
              key={sk.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.008, duration: 0.2 }}
            >
              <SkillChip skill={sk} chipClass={meta.chipClass} opacity={opacity} />
            </motion.div>
          )
        })}
      </div>
      {!expanded && hidden > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          onClick={() => setExpanded(true)}
          className="mt-3 text-[0.55rem] sm:text-xs font-mono text-terminal-purple/60 hover:text-terminal-purple
                     border border-terminal-purple/20 hover:border-terminal-purple/50
                     px-2 py-1 sm:px-3 sm:py-1.5 rounded transition-all duration-200"
        >
          + {hidden} more →
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── Categories view ──────────────────────────────────────────────────────────

function CategoriesView({ skills }: { skills: AggregatedSkill[] }) {
  const grouped = SHOWN_CATEGORIES.reduce<Record<string, AggregatedSkill[]>>((acc, cat) => {
    acc[cat] = skills.filter((s) => s.category === cat).sort((a, b) => b.count - a.count)
    return acc
  }, {})

  return (
    <motion.div
      key="categories"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-2.5 sm:space-y-4 ls:space-y-2.5"
    >
      {SHOWN_CATEGORIES.map((cat, ci) => {
        const meta = CATEGORY_META[cat]
        const catSkills = grouped[cat]
        if (!catSkills?.length) return null
        const maxCount = catSkills[0]?.count ?? 1
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.05, duration: 0.35 }}
          >
            <p className={`text-[11px] font-mono tracking-widest uppercase mb-2.5 ${meta.color}`}>
              // {meta.label}
            </p>
            {cat === 'os' && (
              <p className="font-mono mb-2.5 italic text-terminal-dim/30" style={{ fontSize: '0.55rem' }}>
                /* used Windows since before I could walk — all others in professional/personal contexts below */
              </p>
            )}
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {catSkills.map((sk) => {
                const opacity = Math.max(0.4, Math.pow(sk.count / maxCount, 0.35))
                return <SkillChip key={sk.name} skill={sk} chipClass={meta.chipClass} opacity={opacity} />
              })}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── Skills Matrix ───────────────────────────────────────────────────────────

function SkillsMatrix({ person }: { person: Person }) {
  const skills = aggregateSkills(person)
  const [view, setView] = useState<SkillView>('ranked')

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 ls:px-4 py-7 sm:py-12 ls:py-7">
      <SectionHeader
        prompt="cat skills.json"
        title="Skills Matrix"
        accent="purple"
      />

      <div className="mt-4 mb-5">
        <ViewToggle view={view} onChange={setView} />
      </div>

      <AnimatePresence mode="wait">
        {view === 'categories'
          ? <CategoriesView key="categories" skills={skills} />
          : <RankedView key="ranked" skills={skills} />
        }
      </AnimatePresence>
    </section>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({
  prompt,
  title,
  accent = 'green',
}: {
  prompt: string
  title: string
  accent?: 'green' | 'blue' | 'purple' | 'amber'
}) {
  const accentMap = {
    green: { prompt: 'text-terminal-green', title: 'text-terminal-green text-glow-green', bar: 'bg-terminal-green' },
    blue: { prompt: 'text-terminal-blue', title: 'text-terminal-blue text-glow-blue', bar: 'bg-terminal-blue' },
    purple: { prompt: 'text-terminal-purple', title: 'text-terminal-purple text-glow-purple', bar: 'bg-terminal-purple' },
    amber: { prompt: 'text-terminal-amber', title: 'text-terminal-amber text-glow-amber', bar: 'bg-terminal-amber' },
  }
  const cls = accentMap[accent]
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      <p className={`text-[0.6rem] sm:text-xs ls:text-[0.6rem] font-mono ${cls.prompt} opacity-70`}>$ {prompt}</p>
      <div className="flex items-center gap-3">
        <div className={`w-1 h-8 rounded ${cls.bar}`} />
        <h2 className={`text-xl sm:text-2xl ls:text-xl font-mono font-bold tracking-wider ${cls.title}`}>
          {title}
        </h2>
      </div>
    </motion.div>
  )
}

// ─── Publications ───────────────────────────────────────────────────────────

function PublicationRow({ pub, index }: { pub: Publication; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="group flex flex-col sm:flex-row gap-3 sm:gap-4 ls:gap-3 p-3 rounded-lg border border-terminal-border/50
                 bg-terminal-surface/30 hover:bg-terminal-surface/60 hover:border-terminal-blue/30
                 transition-all duration-200"
    >
      {/* Year badge */}
      <div className="shrink-0">
        <span className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 ls:px-1.5 ls:py-0.5 rounded text-[0.6rem] sm:text-xs ls:text-[0.6rem] font-mono font-bold
                         border border-terminal-blue/40 text-terminal-blue bg-terminal-blue/10">
          {formatDate(pub.date)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-start gap-2">
          <p className="font-mono text-xs sm:text-sm ls:text-xs text-terminal-text group-hover:text-terminal-blue
                        transition-colors duration-200 leading-snug flex-1 min-w-0">
            {pub.url ? (
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-terminal-green hover:text-glow-green transition-all"
              >
                {pub.title}
              </a>
            ) : (
              pub.title
            )}
          </p>
          {statusBadge(pub.status)}
        </div>
        {pub.venue && (
          <p className="text-[0.6rem] sm:text-xs ls:text-[0.6rem] font-mono text-terminal-muted truncate">{pub.venue}</p>
        )}
      </div>
    </motion.div>
  )
}

function PublicationsSection({ publications }: { publications: Publication[] }) {
  const top5 = publications.slice(0, 5)

  return (
    <section className="bg-terminal-surface/20 border-y border-terminal-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-12 ls:py-7 ls:px-4">
        <SectionHeader
          prompt="cat publications.bib | head -5"
          title="Recent Publications"
          accent="blue"
        />
        <div className="mt-4 sm:mt-6 space-y-1.5 sm:space-y-2">
          {top5.map((pub, i) => (
            <PublicationRow key={pub.id} pub={pub} index={i} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <a
            href="https://scholar.google.com/citations?user=Xm7p7mQAAAAJ&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.65rem] sm:text-xs ls:text-[0.65rem] font-mono text-terminal-muted hover:text-terminal-blue transition-colors"
          >
            View all {publications.length} publications on Google Scholar →
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Projects ───────────────────────────────────────────────────────────────

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const navigate = useNavigate()
  const [showOverflow, setShowOverflow] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showOverflow) return
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showOverflow])

  const visibleSkills = project.technologies?.slice(0, 6) ?? []
  const overflowSkills = project.technologies?.slice(6) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -3 }}
      className="group flex flex-col p-3 sm:p-4 ls:p-3 rounded-lg border border-terminal-border
                 bg-terminal-surface/40 hover:bg-terminal-surface/70
                 hover:border-terminal-purple/40 transition-all duration-250"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-mono text-xs sm:text-sm ls:text-xs font-bold text-terminal-text
                       group-hover:text-terminal-purple transition-colors leading-snug">
          {project.url ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal-green hover:text-glow-green transition-all"
            >
              {project.title}
            </a>
          ) : (
            project.title
          )}
        </h3>
        {project.year && (
          <span className="shrink-0 text-[8px] sm:text-[10px] font-mono text-terminal-muted border border-terminal-border
                           rounded px-1.5 py-0.5">
            {formatDate(project.year)}
          </span>
        )}
      </div>

      {/* Description — prefer short tagline, fall back to clamped description */}
      {(project.tagline || project.description) && (
        <p className="text-xs font-mono text-terminal-muted leading-relaxed mb-3 line-clamp-2 flex-1">
          {project.tagline ?? project.description}
        </p>
      )}

      {/* Tech tags */}
      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto relative">
          {visibleSkills.map((tech) => (
            <button
              key={tech}
              onClick={() => navigate(`/graph?q=${encodeURIComponent(tech)}`)}
              className="text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer
                         border border-terminal-purple/25 text-terminal-purple/80
                         bg-terminal-purple/5 hover:bg-terminal-purple/15
                         hover:border-terminal-purple/50 hover:text-terminal-purple
                         transition-all duration-150"
            >
              {tech}
            </button>
          ))}
          {overflowSkills.length > 0 && (
            <div ref={overflowRef} className="relative">
              <button
                onClick={() => setShowOverflow((v) => !v)}
                className="text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer
                           border border-terminal-muted/25 text-terminal-muted
                           bg-terminal-surface/40 hover:bg-terminal-surface/80
                           hover:border-terminal-purple/40 hover:text-terminal-purple/80
                           transition-all duration-150"
              >
                +{overflowSkills.length} skills
              </button>
              {showOverflow && (
                <div className="absolute bottom-full left-0 mb-2 z-50 w-56
                                bg-terminal-bg border border-terminal-purple/30
                                rounded-lg p-2.5 shadow-xl shadow-black/50">
                  <p className="text-[9px] font-mono text-terminal-muted/60 uppercase tracking-widest mb-2">
                    // more skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {overflowSkills.map((tech) => (
                      <button
                        key={tech}
                        onClick={() => { navigate(`/graph?q=${encodeURIComponent(tech)}`); setShowOverflow(false) }}
                        className="text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer
                                   border border-terminal-purple/25 text-terminal-purple/80
                                   bg-terminal-purple/5 hover:bg-terminal-purple/15
                                   hover:border-terminal-purple/50 hover:text-terminal-purple
                                   transition-all duration-150"
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Repo link */}
      {project.repo_url && (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-[10px] font-mono text-terminal-muted hover:text-terminal-green
                     transition-colors self-start"
        >
          ⌥ view repo →
        </a>
      )}
    </motion.div>
  )
}

interface GitHubRepo {
  name: string
  html_url: string
  created_at: string
  pushed_at: string
  stargazers_count: number
}

function RecentReposSection({ projects }: { projects: Project[] }) {
  const [repoCards, setRepoCards] = useState<Array<{ project: Project; created: string; updated: string; stars: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Build lookup: normalize repo URL → YAML project
    const repoMap = new Map<string, Project>()
    for (const proj of projects) {
      if (proj.repo_url) {
        // Normalize: strip trailing slash, lowercase
        const key = proj.repo_url.replace(/\/+$/, '').toLowerCase()
        repoMap.set(key, proj)
      }
    }

    fetch('https://api.github.com/users/PR0CK0/repos?sort=pushed&per_page=30')
      .then((r) => r.json())
      .then((data: GitHubRepo[]) => {
        const matched: typeof repoCards = []
        for (const repo of data) {
          if (repo.name === 'PR0CK0') continue
          const key = repo.html_url.replace(/\/+$/, '').toLowerCase()
          const yamlProj = repoMap.get(key)
          if (yamlProj) {
            matched.push({
              project: yamlProj,
              created: repo.created_at,
              updated: repo.pushed_at,
              stars: repo.stargazers_count,
            })
          }
          if (matched.length >= 6) break
        }
        setRepoCards(matched)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projects])

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 ls:px-4 py-7 sm:py-12 ls:py-7">
      <SectionHeader
        prompt="gh repo list --sort updated --limit 6"
        title="Recent Repos"
        accent="amber"
      />
      <ContributionGraph username="PR0CK0" />
      {loading ? (
        <div className="text-center py-8">
          <span className="text-xs font-mono text-terminal-muted animate-pulse">fetching repos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {repoCards.map(({ project, created, updated, stars }, i) => (
            <RepoProjectCard key={project.id} project={project} created={created} updated={updated} stars={stars} index={i} />
          ))}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center"
      >
        <a
          href="https://github.com/PR0CK0?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.65rem] sm:text-xs ls:text-[0.65rem] font-mono text-terminal-muted hover:text-terminal-amber transition-colors"
        >
          View all repos on GitHub →
        </a>
      </motion.div>
    </section>
  )
}

function RepoProjectCard({ project, created, updated, stars, index }: {
  project: Project; created: string; updated: string; stars: number; index: number
}) {
  const navigate = useNavigate()
  const [showOverflow, setShowOverflow] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showOverflow) return
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showOverflow])

  const visibleSkills = project.technologies?.slice(0, 6) ?? []
  const overflowSkills = project.technologies?.slice(6) ?? []
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -3 }}
      className="group flex flex-col p-3 sm:p-4 ls:p-3 rounded-lg border border-terminal-border
                 bg-terminal-surface/40 hover:bg-terminal-surface/70
                 hover:border-terminal-purple/40 transition-all duration-250"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-mono text-xs sm:text-sm ls:text-xs font-bold text-terminal-text
                       group-hover:text-terminal-purple transition-colors leading-snug">
          {project.url ? (
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              className="hover:text-terminal-green hover:text-glow-green transition-all">
              {project.title}
            </a>
          ) : project.title}
        </h3>
        {stars > 0 && (
          <span className="shrink-0 text-[8px] sm:text-[10px] font-mono text-terminal-amber">
            ★ {stars}
          </span>
        )}
      </div>

      {/* Date chips */}
      <div className="flex gap-1.5 mb-2">
        <span className="text-[7px] sm:text-[9px] font-mono text-terminal-muted border border-terminal-border rounded px-1 py-0.5">
          created {fmtDate(created)}
        </span>
        <span className="text-[7px] sm:text-[9px] font-mono text-terminal-green/70 border border-terminal-green/20 rounded px-1 py-0.5">
          updated {fmtDate(updated)}
        </span>
      </div>

      {/* Description */}
      {(project.tagline || project.description) && (
        <p className="text-xs font-mono text-terminal-muted leading-relaxed mb-3 line-clamp-2 flex-1">
          {project.tagline ?? project.description}
        </p>
      )}

      {/* Tech tags */}
      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto relative">
          {visibleSkills.map((tech) => (
            <button
              key={tech}
              onClick={() => navigate(`/graph?q=${encodeURIComponent(tech)}`)}
              className="text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer
                         border border-terminal-purple/25 text-terminal-purple/80
                         bg-terminal-purple/5 hover:bg-terminal-purple/15
                         hover:border-terminal-purple/50 hover:text-terminal-purple
                         transition-all duration-150"
            >
              {tech}
            </button>
          ))}
          {overflowSkills.length > 0 && (
            <div ref={overflowRef} className="relative">
              <button
                onClick={() => setShowOverflow((v) => !v)}
                className="text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer
                           border border-terminal-muted/25 text-terminal-muted
                           bg-terminal-surface/40 hover:bg-terminal-surface/80
                           hover:border-terminal-purple/40 hover:text-terminal-purple/80
                           transition-all duration-150"
              >
                +{overflowSkills.length} skills
              </button>
              {showOverflow && (
                <div className="absolute bottom-full left-0 mb-2 z-50 w-56
                                bg-terminal-bg border border-terminal-purple/30
                                rounded-lg p-2.5 shadow-xl shadow-black/50">
                  <p className="text-[9px] font-mono text-terminal-muted/60 uppercase tracking-widest mb-2">
                    // more skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {overflowSkills.map((tech) => (
                      <button
                        key={tech}
                        onClick={() => { navigate(`/graph?q=${encodeURIComponent(tech)}`); setShowOverflow(false) }}
                        className="text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer
                                   border border-terminal-purple/25 text-terminal-purple/80
                                   bg-terminal-purple/5 hover:bg-terminal-purple/15
                                   hover:border-terminal-purple/50 hover:text-terminal-purple
                                   transition-all duration-150"
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Repo link */}
      {project.repo_url && (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-[10px] font-mono text-terminal-muted hover:text-terminal-green
                     transition-colors self-start"
        >
          ⌥ view repo →
        </a>
      )}
    </motion.div>
  )
}

// ─── Contribution Graph ──────────────────────────────────────────────────────

type ContributionDay = { date: string; count: number; level: number }
type EventCommit = { repo: string; message: string; sha: string }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CONTRIB_COLORS = [
  'rgba(0,255,136,0.06)',
  'rgba(0,255,136,0.22)',
  'rgba(0,255,136,0.42)',
  'rgba(0,255,136,0.65)',
  'rgba(0,255,136,0.90)',
]

function timeAgo(date: Date): string {
  const total = Math.floor((Date.now() - date.getTime()) / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d > 0) return `${d}d ${h}h ${m}m ago`
  if (h > 0) return `${h}h ${m}m ago`
  if (m > 0) return `${m}m ${s}s ago`
  return `${s}s ago`
}

function ContributionGraph({ username }: { username: string }) {
  const [weeks, setWeeks] = useState<(ContributionDay | null)[][]>([])
  const [total, setTotal] = useState(0)
  const [lastPush, setLastPush] = useState<Date | null>(null)
  const [commitMap, setCommitMap] = useState<Map<string, EventCommit[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{
    day: ContributionDay; commits: EventCommit[]; x: number; y: number
  } | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const ghEventsFetch = (page: number) =>
      fetch(`https://api.github.com/users/${username}/events/public?per_page=100&page=${page}`, {
        headers: { Accept: 'application/vnd.github+json' },
      }).then(r => (r.ok ? r.json() : [])).catch(() => [])

    Promise.all([
      fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`).then(r => r.json()),
      Promise.all([ghEventsFetch(1), ghEventsFetch(2), ghEventsFetch(3)]).then(pages =>
        ([] as any[]).concat(...pages.filter(Array.isArray))
      ),
    ]).then(([contribData, events]) => {
      // ── contributions grid ──────────────────────────────────────────────────
      const days: ContributionDay[] = contribData.contributions
      const yearTotal = (Object.values(contribData.total as Record<string, number>) as number[])
        .reduce((a, b) => a + b, 0)
      setTotal(yearTotal)

      const grid: (ContributionDay | null)[][] = []
      const firstDOW = new Date(days[0].date).getDay()
      let week: (ContributionDay | null)[] = Array(firstDOW).fill(null)
      for (const day of days) {
        week.push(day)
        if (week.length === 7) { grid.push(week); week = [] }
      }
      if (week.length) {
        while (week.length < 7) week.push(null)
        grid.push(week)
      }
      while (grid.length > 0 && grid[grid.length - 1].every(d => d === null)) grid.pop()
      setWeeks(grid)

      // ── events ──────────────────────────────────────────────────────────────
      const map = new Map<string, EventCommit[]>()
      let latestPush: Date | null = null

      for (const ev of (Array.isArray(events) ? events : [])) {
        if (ev.type !== 'PushEvent') continue
        const date = (ev.created_at as string).slice(0, 10)
        const repo = (ev.repo?.name as string ?? '').replace(`${username}/`, '')
        const commits: EventCommit[] = (ev.payload?.commits ?? []).map((c: { message: string; sha: string }) => ({
          repo,
          message: c.message.split('\n')[0].slice(0, 72),
          sha: (c.sha ?? '').slice(0, 7),
        }))
        if (!map.has(date)) map.set(date, [])
        map.get(date)!.push(...commits)
        const d = new Date(ev.created_at as string)
        if (!latestPush || d > latestPush) latestPush = d
      }
      setCommitMap(map)
      setLastPush(latestPush)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [username])

  if (loading) return <div className="my-6 h-[100px] rounded bg-terminal-surface/20 animate-pulse" />
  if (!weeks.length) return null

  const monthLabels = new Map<number, string>()
  const yearLabels  = new Map<number, string>()
  let lastMonth = -1, lastYear = -1
  weeks.forEach((week, wi) => {
    const first = week.find(d => d !== null)
    if (first) {
      const d = new Date(first.date)
      const m = d.getMonth(), y = d.getFullYear()
      if (m !== lastMonth) { monthLabels.set(wi, MONTH_NAMES[m]); lastMonth = m }
      if (y !== lastYear)  { yearLabels.set(wi, String(y));        lastYear  = y  }
    }
  })

  const cell = isMobile ? 9 : 11
  const gap  = isMobile ? 2 : 3
  const labelFont = isMobile ? '8px' : '9px'
  const headerText = isMobile ? '9px' : '10px'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className="my-4 sm:my-6"
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="font-mono text-terminal-muted/60" style={{ fontSize: headerText }}>// commit activity</span>
        <span className="flex items-center gap-3 font-mono" style={{ fontSize: headerText }}>
          <span className="text-terminal-green/50">{total.toLocaleString()} contributions in the last year</span>
          {lastPush && (
            <span className="text-terminal-muted/40">· last push <span className="text-terminal-blue/60">{timeAgo(lastPush)}</span></span>
          )}
        </span>
      </div>
      <div
        className="contrib-scroll overflow-x-auto pb-1 rounded-lg border border-terminal-border/30 bg-terminal-surface/20 p-2.5"
        onMouseLeave={() => setTooltip(null)}
      >
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: `${gap}px`, marginBottom: '1px', height: '11px' }}>
            {weeks.map((_, wi) => (
              <div key={wi} style={{ width: cell, flexShrink: 0, overflow: 'visible', position: 'relative' }}>
                {monthLabels.has(wi) && (
                  <span style={{ fontSize: labelFont, color: 'rgba(200,214,240,0.35)', fontFamily: 'monospace', position: 'absolute', whiteSpace: 'nowrap' }}>
                    {monthLabels.get(wi)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* Year labels */}
          <div style={{ display: 'flex', gap: `${gap}px`, marginBottom: '4px', height: '11px' }}>
            {weeks.map((_, wi) => (
              <div key={wi} style={{ width: cell, flexShrink: 0, overflow: 'visible', position: 'relative' }}>
                {yearLabels.has(wi) && (
                  <span style={{ fontSize: labelFont, color: 'rgba(0,255,136,0.50)', fontFamily: 'monospace', fontWeight: 'bold', position: 'absolute', whiteSpace: 'nowrap' }}>
                    {yearLabels.get(wi)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: 'flex', gap: `${gap}px` }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    onMouseEnter={(e) => {
                      if (!day) return
                      setTooltip({
                        day,
                        commits: commitMap.get(day.date) ?? [],
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }}
                    onMouseMove={(e) => {
                      if (day) setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: '2px',
                      backgroundColor: day !== null ? CONTRIB_COLORS[day.level] : 'transparent',
                      border: day !== null ? '1px solid rgba(0,255,136,0.10)' : 'none',
                      cursor: day?.count ? 'pointer' : 'default',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip — fixed position, follows cursor */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8, transform: 'translateY(-100%)' }}
        >
          <div className="rounded border border-terminal-border bg-terminal-bg/95 backdrop-blur-sm px-2.5 py-2 font-mono text-[10px] shadow-xl max-w-[260px]">
            <div className="text-terminal-green/70 mb-1">{tooltip.day.date} · {tooltip.day.count} commit{tooltip.day.count !== 1 ? 's' : ''}</div>
            {tooltip.commits.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {tooltip.commits.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <span className="text-terminal-purple/60 shrink-0">{c.sha}</span>
                    <span className="text-terminal-muted/80 truncate">{c.message}</span>
                  </div>
                ))}
                {tooltip.commits.length > 4 && (
                  <div className="text-terminal-muted/40">+{tooltip.commits.length - 4} more</div>
                )}
              </div>
            ) : (
              <div className="text-terminal-muted/40 italic">
                {REDACTED_MSGS[tooltip.day.date.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % REDACTED_MSGS.length]}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  const buildDate = new Date(__BUILD_DATE__)
  const buildStr = buildDate.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <footer className="border-t border-terminal-border bg-terminal-surface/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[0.65rem] sm:text-xs ls:text-[0.65rem] font-mono text-terminal-muted text-center sm:text-left">
            <span className="text-terminal-green">procko.pro</span>
            {' · '}built with{' '}
            <span className="text-terminal-blue">LinkML</span>
            {' + '}
            <span className="text-terminal-purple">React</span>
            {' + '}
            <span className="text-terminal-amber">Cytoscape</span>
          </p>
          <nav className="flex flex-wrap justify-center gap-3 sm:gap-5 ls:gap-3 text-[0.65rem] sm:text-xs ls:text-[0.65rem] font-mono text-terminal-muted">
            {[
              { label: '~/graph', href: '/graph' },
              { label: '~/cv', href: '/cv' },
              { label: '~/resume', href: '/resume' },
              { label: '~/legacy', href: '/legacy' },
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
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-terminal-border/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-terminal-muted/40 text-[9px] sm:text-[10px] font-mono">
          <span className="flex items-center gap-2">
            <span className="animate-blink">▮</span>
            <span>© {new Date().getFullYear()} Tyler T. Procko. All rights reserved.</span>
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

// ─── Root ───────────────────────────────────────────────────────────────────

export default function Landing() {
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPortfolioData()
      .then(setPerson)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
        <div className="font-mono text-terminal-green text-sm flex items-center gap-3">
          <span className="animate-blink">▮</span>
          <span>loading portfolio data...</span>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
        <div className="font-mono text-terminal-red text-sm border border-terminal-red/40 rounded p-6 max-w-md">
          <p className="text-terminal-red font-bold mb-2">ERROR: data load failed</p>
          <p className="text-terminal-muted text-xs">{error ?? 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  const publications = person.publications ?? []
  const projects = person.projects ?? []
  const bootLines = buildBootLines(publications.length)
  const stats = buildStats(publications.length, projects.length)

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono">
      <SEO path="/" />
      <HeroSection person={person} bootLines={bootLines} />
      <StatsBar stats={stats} />

      <SkillsMatrix person={person} />

      {publications.length > 0 && (
        <PublicationsSection publications={publications} />
      )}

      <RecentReposSection projects={projects} />

      <Footer />
    </div>
  )
}
