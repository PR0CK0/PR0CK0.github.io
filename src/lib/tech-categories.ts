/**
 * Single source of truth for competency term → category mappings.
 * Terms are split into bounded vocabulary files under ./vocab/ and
 * re-exported here as COMPETENCY_CATEGORIES for backwards compatibility.
 */

export type { CompetencyCategory } from './vocab/vocab-types'
export { COMPETENCY_CATEGORY_LABELS } from './vocab/vocab-types'
export { TECH_VOCAB } from './vocab/tech-vocab'
export { DOMAIN_VOCAB } from './vocab/domain-vocab'
export { SOFT_SKILL_VOCAB } from './vocab/soft-skill-vocab'
export { PERSONAL_VOCAB } from './vocab/personal-vocab'

import { TECH_VOCAB } from './vocab/tech-vocab'
import { DOMAIN_VOCAB } from './vocab/domain-vocab'
import { SOFT_SKILL_VOCAB } from './vocab/soft-skill-vocab'
import { PERSONAL_VOCAB } from './vocab/personal-vocab'
import type { CompetencyCategory } from './vocab/vocab-types'

/** Combined vocabulary — all terms across all categories. */
export const COMPETENCY_CATEGORIES: Record<string, CompetencyCategory> = {
  ...TECH_VOCAB,
  ...DOMAIN_VOCAB,
  ...SOFT_SKILL_VOCAB,
  ...PERSONAL_VOCAB,
}
