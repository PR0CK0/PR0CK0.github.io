import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { loadPortfolioData } from '@/lib/yaml-loader'
import { TECH_CATEGORIES, type SkillCategory } from '@/lib/tech-categories'
import type { Person, Publication, Project } from '@/lib/schema'

// ─── Boot sequence lines ───────────────────────────────────────────────────
function buildBootLines(pubCount: number, clearance: string) {
  return [
    { prefix: '>', text: 'initializing procko.pro...' },
    { prefix: '>', text: 'loading knowledge graph engine...' },
    { prefix: '>', text: `PhD loaded. publications: ${pubCount}` },
    { prefix: '>', text: `clearance: ${clearance.toUpperCase()}` },
    { prefix: '>', text: 'status: AVAILABLE' },
  ]
}
type BootLine = ReturnType<typeof buildBootLines>[number]

// ─── Stats ─────────────────────────────────────────────────────────────────
function buildStats(pubCount: number, projCount: number) {
  return [
    { label: 'Publications', value: `${pubCount}` },
    { label: 'Java / Python', value: '9+ yrs' },
    { label: 'Projects', value: `${projCount}` },
    { label: 'Clearance', value: 'SECRET' },
    { label: 'Degree', value: 'Ph.D. CSCE' },
    { label: 'Membership', value: 'IEEE' },
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
  tools: {
    label: 'Tools',
    color: 'text-terminal-purple',
    chipClass:
      'border border-terminal-purple/30 text-terminal-purple bg-terminal-purple/5 hover:bg-terminal-purple/15 hover:border-terminal-purple/60',
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
  'prog_languages', 'data_languages', 'libraries', 'tools',
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
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${m.cls} whitespace-nowrap`}>
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

// ─── Sub-components ────────────────────────────────────────────────────────

function SocialButton({ label, href, icon }: { label: string; href: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-terminal-border
                 text-terminal-muted hover:text-terminal-green hover:border-terminal-green/50
                 hover:bg-terminal-green/5 transition-all duration-200 text-xs font-mono"
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
      className={`px-5 py-2 rounded border font-mono text-sm transition-all duration-200 ${cls}`}
    >
      {children}
    </button>
  )
}

// ─── Hero / Boot Section ────────────────────────────────────────────────────

function BootSequence({ lines, onComplete }: { lines: BootLine[]; onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [showCursor, setShowCursor] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visibleLines < lines.length) {
      timerRef.current = setTimeout(() => {
        setVisibleLines((v) => v + 1)
      }, 180)
    } else {
      timerRef.current = setTimeout(() => {
        setShowCursor(true)
        timerRef.current = setTimeout(() => {
          onComplete()
        }, 400)
      }, 100)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visibleLines, lines, onComplete])

  return (
    <div className="font-mono text-sm space-y-1">
      {lines.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="flex gap-2"
        >
          <span className="text-terminal-green select-none">{line.prefix}</span>
          <span className="text-terminal-text">{line.text}</span>
        </motion.div>
      ))}
      {showCursor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2"
        >
          <span className="text-terminal-green select-none">$</span>
          <span className="animate-blink text-terminal-green">▮</span>
        </motion.div>
      )}
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
  }

  const socials = (person.social_links ?? []).filter((s) =>
    ['GitHub', 'LinkedIn', 'Google Scholar', 'ORCiD'].includes(s.platform)
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
      className="mt-12 space-y-5"
    >
      {/* Name */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-widest
                   text-terminal-green text-glow-green animate-glow-pulse"
      >
        {person.name.toUpperCase()}
      </motion.h1>

      {/* Title */}
      <motion.p
        variants={itemVariants}
        className="text-terminal-blue text-glow-blue font-mono text-lg sm:text-xl tracking-wide"
      >
        AI Engineer — Agentic LLMs · Knowledge Graphs · Ontologies
      </motion.p>

      {/* Tagline */}
      <motion.p
        variants={itemVariants}
        className="italic text-terminal-muted font-mono text-sm sm:text-base max-w-xl"
      >
        &quot;{person.tagline ?? 'Casting the net for knowledge in a sea of infinite information.'}&quot;
      </motion.p>

      {/* Social links */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {socials.map((s) => {
          const meta = socialMeta[s.platform] ?? { icon: '→', label: s.platform }
          return <SocialButton key={s.id} label={meta.label} href={s.url} icon={meta.icon} />
        })}
      </motion.div>

      {/* CTA buttons */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 pt-2">
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

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-terminal-bg">
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
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-20 w-full max-w-5xl mx-auto px-6 py-24">
        {/* Terminal window chrome */}
        <div className="rounded-lg border border-terminal-border bg-terminal-surface/60 backdrop-blur-sm overflow-hidden shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-terminal-border bg-terminal-bg/80">
            <span className="w-3 h-3 rounded-full bg-terminal-red/70" />
            <span className="w-3 h-3 rounded-full bg-terminal-amber/70" />
            <span className="w-3 h-3 rounded-full bg-terminal-green/70" />
            <span className="ml-3 text-terminal-muted text-xs font-mono tracking-widest">
              procko@portfolio ~ bash
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-6 sm:p-8">
            <BootSequence lines={bootLines} onComplete={() => setBootDone(true)} />

            <AnimatePresence>
              {bootDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <HeroContent person={person} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scroll hint */}
        {bootDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex justify-center mt-10"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="text-terminal-muted text-xs font-mono flex flex-col items-center gap-1"
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
      <div className="flex flex-wrap justify-center gap-0 divide-x divide-terminal-border">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="flex flex-col items-center px-8 py-5 min-w-[130px]"
          >
            <span className="text-2xl font-mono font-bold text-terminal-green text-glow-green">
              {s.value}
            </span>
            <span className="text-xs font-mono text-terminal-muted mt-1 tracking-widest uppercase">
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
  const counts = new Map<string, number>()

  const allTech = [
    ...(person.projects ?? []).flatMap((p) => p.technologies ?? []),
    ...(person.work_experiences ?? []).flatMap((w) => w.technologies ?? []),
    ...(person.courses ?? []).flatMap((c) => c.technologies ?? []),
    ...(person.extracurriculars ?? []).flatMap((e) => e.technologies ?? []),
  ]

  for (const tech of allTech) {
    counts.set(tech, (counts.get(tech) ?? 0) + 1)
  }

  const result: AggregatedSkill[] = []
  for (const [name, count] of counts.entries()) {
    const category = TECH_CATEGORIES[name]
    if (category) result.push({ name, count, category })
  }
  return result
}

function SkillChip({ skill, chipClass }: { skill: AggregatedSkill; chipClass: string }) {
  const navigate = useNavigate()
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      onClick={() => navigate(`/graph?q=${encodeURIComponent(skill.name)}`)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono
                  transition-all duration-150 cursor-pointer ${chipClass}`}
    >
      {skill.name}
      {skill.count > 1 && (
        <span className="opacity-50 text-[10px]">×{skill.count}</span>
      )}
    </motion.span>
  )
}

function SkillsMatrix({ person }: { person: Person }) {
  const skills = aggregateSkills(person)

  const grouped = SHOWN_CATEGORIES.reduce<Record<string, AggregatedSkill[]>>((acc, cat) => {
    acc[cat] = skills
      .filter((s) => s.category === cat)
      .sort((a, b) => b.count - a.count)
    return acc
  }, {})

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <SectionHeader
        prompt="cat skills.json"
        title="Skills Matrix"
        accent="purple"
      />

      <div className="mt-10 space-y-8">
        {SHOWN_CATEGORIES.map((cat, ci) => {
          const meta = CATEGORY_META[cat]
          const catSkills = grouped[cat]
          if (!catSkills?.length) return null
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: ci * 0.08, duration: 0.45 }}
            >
              <p className={`text-xs font-mono tracking-widest uppercase mb-3 ${meta.color}`}>
                // {meta.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {catSkills.map((sk) => (
                  <SkillChip key={sk.name} skill={sk} chipClass={meta.chipClass} />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
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
      <p className={`text-xs font-mono ${cls.prompt} opacity-70`}>$ {prompt}</p>
      <div className="flex items-center gap-3">
        <div className={`w-1 h-8 rounded ${cls.bar}`} />
        <h2 className={`text-2xl sm:text-3xl font-mono font-bold tracking-wider ${cls.title}`}>
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
      className="group flex gap-4 p-4 rounded-lg border border-terminal-border/50
                 bg-terminal-surface/30 hover:bg-terminal-surface/60 hover:border-terminal-blue/30
                 transition-all duration-200"
    >
      {/* Year badge */}
      <div className="shrink-0">
        <span className="inline-block px-2 py-1 rounded text-xs font-mono font-bold
                         border border-terminal-blue/40 text-terminal-blue bg-terminal-blue/10">
          {formatDate(pub.date)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-start gap-2">
          <p className="font-mono text-sm text-terminal-text group-hover:text-terminal-blue
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
          <p className="text-xs font-mono text-terminal-muted truncate">{pub.venue}</p>
        )}
      </div>
    </motion.div>
  )
}

function PublicationsSection({ publications }: { publications: Publication[] }) {
  const top5 = publications.slice(0, 5)

  return (
    <section className="bg-terminal-surface/20 border-y border-terminal-border">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeader
          prompt="cat publications.bib | head -5"
          title="Recent Publications"
          accent="blue"
        />
        <div className="mt-10 space-y-3">
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
            className="text-xs font-mono text-terminal-muted hover:text-terminal-blue transition-colors"
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -3 }}
      className="group flex flex-col p-5 rounded-lg border border-terminal-border
                 bg-terminal-surface/40 hover:bg-terminal-surface/70
                 hover:border-terminal-purple/40 transition-all duration-250"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-mono text-sm font-bold text-terminal-text
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
          <span className="shrink-0 text-[10px] font-mono text-terminal-muted border border-terminal-border
                           rounded px-1.5 py-0.5">
            {formatDate(project.year)}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs font-mono text-terminal-muted leading-relaxed mb-3 line-clamp-3 flex-1">
          {project.description}
        </p>
      )}

      {/* Tech tags */}
      {project.technologies && project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {project.technologies.slice(0, 6).map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded
                         border border-terminal-purple/25 text-terminal-purple/80
                         bg-terminal-purple/5"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 6 && (
            <span className="text-[10px] font-mono text-terminal-muted">
              +{project.technologies.length - 6}
            </span>
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

function ProjectsSection({ projects }: { projects: Project[] }) {
  const featured = projects.filter((p) => p.featured)
  const others = projects.filter((p) => !p.featured)
  const top6 = [...featured, ...others].slice(0, 6)

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <SectionHeader
        prompt="ls -la ~/projects/ | head -6"
        title="Featured Projects"
        accent="amber"
      />
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {top6.map((proj, i) => (
          <ProjectCard key={proj.id} project={proj} index={i} />
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
          href="https://github.com/PR0CK0?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-terminal-muted hover:text-terminal-amber transition-colors"
        >
          View all {projects.length} projects on GitHub →
        </a>
      </motion.div>
    </section>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-terminal-border bg-terminal-surface/30">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-terminal-muted">
            <span className="text-terminal-green">procko.pro</span>
            {' · '}built with{' '}
            <span className="text-terminal-blue">LinkML</span>
            {' + '}
            <span className="text-terminal-purple">React</span>
            {' + '}
            <span className="text-terminal-amber">Cytoscape</span>
          </p>
          <nav className="flex gap-5 text-xs font-mono text-terminal-muted">
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
        <div className="mt-6 flex items-center justify-center gap-2 text-terminal-muted/40 text-[10px] font-mono">
          <span className="animate-blink">▮</span>
          <span>© {new Date().getFullYear()} Tyler T. Procko. All rights reserved.</span>
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
  const bootLines = buildBootLines(publications.length, person.clearance ?? 'SECRET [TIER 3]')
  const stats = buildStats(publications.length, projects.length)

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono">
      <HeroSection person={person} bootLines={bootLines} />
      <StatsBar stats={stats} />

      <SkillsMatrix person={person} />

      {publications.length > 0 && (
        <PublicationsSection publications={publications} />
      )}

      {projects.length > 0 && (
        <ProjectsSection projects={projects} />
      )}

      <Footer />
    </div>
  )
}
