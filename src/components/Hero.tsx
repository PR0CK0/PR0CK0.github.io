import { motion } from 'framer-motion'
import type { Person } from '../types'

interface Props {
  person: Person
}

export default function Hero({ person }: Props) {
  const gh = person.social_links?.find((s) => s.platform === 'GitHub')
  const li = person.social_links?.find((s) => s.platform === 'LinkedIn')
  const gs = person.social_links?.find((s) => s.platform === 'Google Scholar')

  return (
    <section className="min-h-screen flex flex-col justify-center px-6 py-20 max-w-5xl mx-auto">
      {/* terminal bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 mb-8"
      >
        <span className="w-3 h-3 rounded-full bg-terminal-red" />
        <span className="w-3 h-3 rounded-full bg-terminal-amber" />
        <span className="w-3 h-3 rounded-full bg-terminal-green" />
        <span className="ml-4 text-xs font-mono text-terminal-muted">
          procko@portfolio ~ bash
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-terminal-green text-sm font-mono mb-2 text-glow-green"
      >
        $ whoami
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-5xl md:text-7xl font-bold font-mono text-terminal-text tracking-tight mb-3"
      >
        TYLER T. PROCKO
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-terminal-blue font-mono text-lg mb-2 text-glow-blue"
      >
        {person.title ?? 'Ph.D. · AI/Knowledge Graph Engineer'}
      </motion.p>

      {person.tagline && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-terminal-muted font-mono text-sm italic mb-8 max-w-xl"
        >
          "{person.tagline}"
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap gap-4 items-center font-mono text-sm"
      >
        {gh && (
          <a href={gh.url} target="_blank" rel="noopener noreferrer"
            className="text-terminal-muted hover:text-terminal-green transition-colors">
            gh/{gh.handle}
          </a>
        )}
        {li && (
          <a href={li.url} target="_blank" rel="noopener noreferrer"
            className="text-terminal-muted hover:text-terminal-blue transition-colors">
            in/{li.handle}
          </a>
        )}
        {gs && (
          <a href={gs.url} target="_blank" rel="noopener noreferrer"
            className="text-terminal-muted hover:text-terminal-amber transition-colors">
            scholar
          </a>
        )}
        {person.orcid && (
          <a href={`https://orcid.org/${person.orcid}`} target="_blank" rel="noopener noreferrer"
            className="text-terminal-muted hover:text-terminal-purple transition-colors">
            orcid
          </a>
        )}
        <a href="/tyler-procko-cv.pdf" target="_blank" rel="noopener noreferrer"
          className="text-terminal-amber hover:text-glow-amber transition-all font-bold">
          ~/cv.pdf →
        </a>
      </motion.div>

      {person.clearance && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-6 text-xs font-mono text-terminal-muted"
        >
          <span className="text-terminal-green">●</span> {person.clearance}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-4 flex items-center gap-2 text-xs font-mono text-terminal-muted"
      >
        <span>{person.location}</span>
        {person.availability && (
          <>
            <span className="text-terminal-border">|</span>
            <span>{person.availability}</span>
          </>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-12 text-xs font-mono text-terminal-muted"
      >
        Generated from LinkML YAML source
      </motion.p>
    </section>
  )
}
