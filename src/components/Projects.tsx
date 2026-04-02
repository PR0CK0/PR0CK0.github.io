import { motion } from 'framer-motion'
import type { Person, Project } from '../types'
import SectionHeader from './SectionHeader'

interface Props { person: Person }

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      className="border border-terminal-border bg-terminal-surface/20 rounded p-5 flex flex-col gap-3 hover:border-terminal-amber/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-mono font-bold text-terminal-text text-sm leading-snug flex-1 min-w-0">
          {project.url
            ? <a href={project.url} target="_blank" rel="noopener noreferrer"
                className="hover:text-terminal-amber transition-colors">{project.title}</a>
            : project.title}
        </h3>
        {project.year && (
          <span className="text-xs font-mono text-terminal-muted shrink-0">{project.year}</span>
        )}
      </div>

      {project.description && (
        <p className="text-xs font-mono text-terminal-muted leading-relaxed">{project.description}</p>
      )}

      {project.technologies && project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.technologies.map((t) => (
            <span key={t} className="text-xs font-mono px-2 py-0.5 rounded bg-terminal-bg border border-terminal-border text-terminal-muted">
              {t}
            </span>
          ))}
        </div>
      )}

      {project.repo_url && (
        <a href={project.repo_url} target="_blank" rel="noopener noreferrer"
          className="text-xs font-mono text-terminal-muted hover:text-terminal-green transition-colors self-start">
          ⌥ view repo →
        </a>
      )}
    </motion.div>
  )
}

export default function Projects({ person }: Props) {
  const projects = (person.projects ?? []).slice(0, 8)

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <SectionHeader prompt='ls -la ~/projects/ | head -6' title="Featured Projects" accent="amber" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
