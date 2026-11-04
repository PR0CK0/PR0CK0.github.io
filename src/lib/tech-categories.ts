import catalog from '../../public/data/competencies.json'
import { resolveCompetency, type CompetencyCategory } from './competencies'

export { COMPETENCY_CATEGORY_LABELS, type CompetencyCategory } from './competencies'

/** Canonical display names for category menus; aliases do not add extra skills. */
export const COMPETENCY_CATEGORIES: Record<string, CompetencyCategory> = Object.fromEntries(
  catalog.terms.map(term => [term.label, resolveCompetency(term.id).category]),
)
