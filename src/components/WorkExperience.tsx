import { motion } from 'framer-motion'
import type { Person, WorkExperience as WE } from '../types'
import SectionHeader from './SectionHeader'

interface Props { person: Person }

function JobCard({ job, index }: { job: WE; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      className="border-l-2 border-terminal-border pl-6 pb-10 relative"
    >
      <span className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-terminal-green" />
      <p className="text-xs font-mono text-terminal-muted mb-1">
        {job.start_date} — {job.is_current ? 'Present' : (job.end_date ?? '')}
        {job.location && <span className="ml-3">· {job.location}</span>}
      </p>
      <h3 className="font-mono font-bold text-terminal-text">{job.title}</h3>
      <p className="text-terminal-blue font-mono text-sm mb-3">{job.organization}</p>
      {job.description && (
        <ul className="space-y-1">
          {job.description.map((d, i) => (
            <li key={i} className="text-xs font-mono text-terminal-text leading-relaxed flex gap-2">
              <span className="text-terminal-muted shrink-0">›</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
      {job.technologies && job.technologies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {job.technologies.map((t) => (
            <span key={t} className="text-xs font-mono px-2 py-0.5 rounded bg-terminal-surface border border-terminal-border text-terminal-muted">
              {t}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function WorkExperience({ person }: Props) {
  const jobs = person.work_experiences ?? []
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <SectionHeader prompt="cat work.log" title="Work Experience" accent="blue" />
      <div className="mt-10">
        {jobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
      </div>
    </section>
  )
}
