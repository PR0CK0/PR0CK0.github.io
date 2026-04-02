import { motion } from 'framer-motion'
import type { Person } from '../types'
import SectionHeader from './SectionHeader'

interface Props { person: Person }

export default function Summary({ person }: Props) {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <SectionHeader prompt="cat summary.txt" title="Summary" accent="green" />
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mt-8 font-mono text-sm text-terminal-text leading-relaxed whitespace-pre-line max-w-3xl"
      >
        {person.summary}
      </motion.p>

      {person.mbti && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-xs font-mono text-terminal-muted"
        >
          MBTI: <span className="text-terminal-purple">{person.mbti}</span>
        </motion.p>
      )}
    </section>
  )
}
