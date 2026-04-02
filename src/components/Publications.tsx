import { motion } from 'framer-motion'
import type { Person, Publication } from '../types'
import SectionHeader from './SectionHeader'

interface Props { person: Person }

function statusBadge(status?: string) {
  if (status === 'awaiting_publication') {
    return <span className="text-xs font-mono text-terminal-amber ml-2">[In Press]</span>
  }
  if (status === 'in_progress') {
    return <span className="text-xs font-mono text-terminal-muted ml-2">[In Progress]</span>
  }
  return null
}

function PubRow({ pub, index }: { pub: Publication; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="border border-terminal-border rounded p-4 hover:border-terminal-blue/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-terminal-blue font-mono text-xs shrink-0 mt-0.5">[{index + 1}]</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono text-terminal-text leading-snug flex-1 min-w-0">
            {pub.url
              ? <a href={pub.url} target="_blank" rel="noopener noreferrer"
                  className="hover:text-terminal-green hover:text-glow-green transition-all">{pub.title}</a>
              : pub.title}
            {statusBadge(pub.status)}
          </p>
          {pub.venue && (
            <p className="text-xs font-mono text-terminal-muted truncate mt-1">{pub.venue}</p>
          )}
          {pub.authors && pub.authors.length > 0 && (
            <p className="text-xs font-mono text-terminal-muted mt-1 truncate">
              {pub.authors.join(', ')}
            </p>
          )}
          {pub.date && (
            <p className="text-xs font-mono text-terminal-muted mt-1">{pub.date}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Publications({ person }: Props) {
  const published = (person.publications ?? [])
    .filter((p) => p.status === 'published')
    .slice(0, 10)

  const gs = person.social_links?.find((s) => s.platform === 'Google Scholar')

  return (
    <section className="bg-terminal-surface/20 border-y border-terminal-border">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeader
          prompt="cat publications.bib | head -5"
          title="Recent Publications"
          accent="blue"
        />
        <div className="mt-10 space-y-3">
          {published.map((p, i) => (
            <PubRow key={p.id} pub={p} index={i} />
          ))}
        </div>
        {gs && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <a href={gs.url} target="_blank" rel="noopener noreferrer"
              className="text-xs font-mono text-terminal-muted hover:text-terminal-blue transition-colors">
              View all 40+ publications on Google Scholar →
            </a>
          </motion.div>
        )}
      </div>
    </section>
  )
}
