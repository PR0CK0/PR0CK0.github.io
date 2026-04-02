import { motion } from 'framer-motion'
import type { Person, Skill } from '../types'
import SectionHeader from './SectionHeader'

interface Props { person: Person }

const categoryOrder = [
  'languages', 'libraries', 'tools', 'cloud', 'vocabularies',
  'ai_tools', 'design', 'os', 'soft_skills',
]

const categoryLabels: Record<string, string> = {
  languages:   'Languages',
  libraries:   'Libraries & Frameworks',
  tools:       'Tools',
  cloud:       'Cloud & Infra',
  vocabularies:'Ontologies & Vocabularies',
  ai_tools:    'AI Tools',
  design:      'Design',
  os:          'Operating Systems',
  soft_skills: 'Soft Skills',
}

const proficiencyColor: Record<string, string> = {
  expert:       'border-terminal-green text-terminal-green',
  advanced:     'border-terminal-blue text-terminal-blue',
  intermediate: 'border-terminal-amber text-terminal-amber',
  familiar:     'border-terminal-muted text-terminal-muted',
}

function SkillChip({ skill }: { skill: Skill }) {
  const cls = proficiencyColor[skill.proficiency ?? 'familiar']
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cls} bg-transparent`}>
      {skill.name}
      {skill.years_experience ? <span className="ml-1 opacity-60">{skill.years_experience}y</span> : null}
    </span>
  )
}

export default function Skills({ person }: Props) {
  const skills = person.skills ?? []

  const grouped = categoryOrder.reduce<Record<string, Skill[]>>((acc, cat) => {
    const items = skills.filter((s) => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  // catch any uncategorized
  const uncategorized = skills.filter((s) => !s.category || !categoryOrder.includes(s.category))
  if (uncategorized.length) grouped['other'] = uncategorized

  return (
    <section className="bg-terminal-surface/20 border-y border-terminal-border">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeader prompt="cat skills.json" title="Skills Matrix" accent="purple" />
        <div className="mt-10 space-y-8">
          {Object.entries(grouped).map(([cat, items], gi) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.06 }}
            >
              <p className="text-xs font-mono text-terminal-muted mb-3 uppercase tracking-widest">
                {categoryLabels[cat] ?? cat}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => <SkillChip key={s.id} skill={s} />)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-wrap gap-4 text-xs font-mono text-terminal-muted"
        >
          {Object.entries(proficiencyColor).map(([p, cls]) => (
            <span key={p} className={`${cls}`}>■ {p}</span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
