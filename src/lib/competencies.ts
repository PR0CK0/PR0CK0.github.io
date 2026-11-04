import catalog from '../data/competencies.json'
import type { Person } from './schema'

export const COMPETENCY_CATEGORY_LABELS = catalog.categories
export type CompetencyCategory = keyof typeof catalog.categories
export interface Competency {
  id: string
  label: string
  category: CompetencyCategory
  aliases: string[]
}
export interface AggregatedSkill {
  id: string
  name: string
  count: number
  category: CompetencyCategory
}

const TERM_FIELDS = ['technologies', 'domains', 'soft_skills', 'personal_skills'] as const
type CompetencyRecord = Partial<Record<typeof TERM_FIELDS[number], string[]>>
const normalize = (value: string) => value.trim().toLowerCase()

/** Fail early on ambiguous references; IDs remain stable when labels change. */
export function createCompetencyResolver(terms: Competency[]) {
  const lookup = new Map<string, Competency>()
  const ids = new Set<string>()
  for (const term of terms) {
    if (![term.id, term.label, term.category].every(value => typeof value === 'string' && value.trim())
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(term.id)
      || !Object.prototype.hasOwnProperty.call(catalog.categories, term.category)
      || !Array.isArray(term.aliases)
      || !term.aliases.every(value => typeof value === 'string' && value.trim())) {
      throw new Error('Invalid competency catalog entry')
    }
    const id = normalize(term.id)
    if (ids.has(id)) throw new Error(`Duplicate competency ID: ${term.id}`)
    ids.add(id)
    for (const [index, value] of [term.id, term.label, ...term.aliases].entries()) {
      const key = normalize(value)
      if (lookup.has(key)) {
        if (index === 1 && key === id && lookup.get(key) === term) continue
        throw new Error(`Ambiguous competency reference: ${value}`)
      }
      lookup.set(key, term)
    }
  }
  return (reference: string): Competency => {
    const term = lookup.get(normalize(reference))
    if (!term) throw new Error(`Unknown competency: ${reference}`)
    return term
  }
}

export const resolveCompetency = createCompetencyResolver(catalog.terms as Competency[])

export function competencyNodeId(term: Competency): string {
  return `competency-${term.id}`
}

export function getCompetencyNodeType(term: Competency): 'skill' | 'domain' | 'soft_skill' | 'personal_skill' {
  switch (term.category) {
    case 'domains': return 'domain'
    case 'soft_skills': return 'soft_skill'
    case 'personal': return 'personal_skill'
    default: return 'skill'
  }
}

/** Field placement never overrides the catalog or creates duplicate evidence. */
export function getRecordCompetencies(entry: CompetencyRecord): Competency[] {
  const terms = TERM_FIELDS.flatMap(field => entry[field] ?? []).map(resolveCompetency)
  return [...new Map(terms.map(term => [term.id, term])).values()]
}

/** One count per supporting record, using the graph's evidence visibility policy. */
export function aggregateCompetencies(person: Person): AggregatedSkill[] {
  const records: CompetencyRecord[] = [
    ...(person.education ?? []),
    ...(person.work_experiences ?? []).filter(entry => !entry.graph_exclude),
    ...(person.publications ?? []),
    ...(person.projects ?? []).filter(entry => !entry.cv_exclude),
    ...(person.courses ?? []),
    ...(person.certificates ?? []).filter(entry => !entry.deprecated),
    ...(person.talks ?? []),
    ...(person.extracurriculars ?? []),
  ]
  const counts = new Map<string, AggregatedSkill>()
  for (const record of records) {
    for (const term of getRecordCompetencies(record)) {
      const existing = counts.get(term.id)
      if (existing) existing.count++
      else counts.set(term.id, { id: term.id, name: term.label, category: term.category, count: 1 })
    }
  }
  return [...counts.values()].sort((a, b) => a.id.localeCompare(b.id))
}
