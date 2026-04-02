import { motion } from 'framer-motion'
import type { Person, Education as Edu } from '../types'
import SectionHeader from './SectionHeader'

interface Props { person: Person }

function EduCard({ edu, index }: { edu: Edu; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border border-terminal-border bg-terminal-surface/20 rounded p-6"
    >
      <p className="text-xs font-mono text-terminal-muted mb-1">
        {edu.start_date} — {edu.end_date ?? 'Present'}
      </p>
      <h3 className="font-mono font-bold text-terminal-text">{edu.degree} · {edu.field}</h3>
      <p className="text-terminal-blue font-mono text-sm mt-1">{edu.institution}</p>
      {edu.gpa && (
        <p className="text-xs font-mono text-terminal-muted mt-2">GPA: {edu.gpa}</p>
      )}
      {edu.distinction && (
        <p className="text-xs font-mono text-terminal-amber mt-1">With Distinction</p>
      )}
      {edu.notes && edu.notes.length > 0 && (
        <ul className="mt-3 space-y-1">
          {edu.notes.map((n, i) => (
            <li key={i} className="text-xs font-mono text-terminal-text flex gap-2">
              <span className="text-terminal-muted shrink-0">›</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

export default function Education({ person }: Props) {
  const edus = person.education ?? []
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <SectionHeader prompt="cat transcript.txt" title="Education" accent="purple" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {edus.map((e, i) => (
          <EduCard key={e.id} edu={e} index={i} />
        ))}
      </div>
    </section>
  )
}
