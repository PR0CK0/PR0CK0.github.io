import { motion } from 'framer-motion'
import type { Person } from '../types'
import SectionHeader from './SectionHeader'

interface Props { person: Person }

export default function Awards({ person }: Props) {
  const awards = person.awards ?? []
  const certs  = person.certificates ?? []

  return (
    <section className="max-w-5xl mx-auto px-6 py-20 space-y-16">
      {/* Awards */}
      <div>
        <SectionHeader prompt="ls ~/awards/" title="Awards & Honors" accent="amber" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {awards.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="border border-terminal-border rounded p-4 hover:border-terminal-amber/40 transition-colors"
            >
              <p className="font-mono font-bold text-terminal-text text-sm">{a.title}</p>
              {a.issuer && <p className="text-xs font-mono text-terminal-blue mt-1">{a.issuer}</p>}
              {a.date   && <p className="text-xs font-mono text-terminal-muted mt-1">{a.date}</p>}
              {a.description && <p className="text-xs font-mono text-terminal-muted mt-2 leading-relaxed">{a.description}</p>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <SectionHeader prompt="ls ~/certs/" title="Certifications" accent="purple" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {certs.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="border border-terminal-border rounded p-4 hover:border-terminal-purple/40 transition-colors"
            >
              <p className="font-mono font-bold text-terminal-text text-sm">
                {c.url
                  ? <a href={c.url} target="_blank" rel="noopener noreferrer"
                      className="hover:text-terminal-purple transition-colors">{c.title}</a>
                  : c.title}
                {c.status === 'in_progress' && (
                  <span className="ml-2 text-xs text-terminal-amber">[In Progress]</span>
                )}
              </p>
              {c.issuer && <p className="text-xs font-mono text-terminal-blue mt-1">{c.issuer}</p>}
              {c.date   && <p className="text-xs font-mono text-terminal-muted mt-1">{c.date}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
