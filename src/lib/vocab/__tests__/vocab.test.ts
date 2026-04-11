import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { load as parseYaml } from 'js-yaml'
import { TECH_VOCAB } from '../tech-vocab'
import { DOMAIN_VOCAB } from '../domain-vocab'
import { SOFT_SKILL_VOCAB } from '../soft-skill-vocab'
import { PERSONAL_VOCAB } from '../personal-vocab'
import { COMPETENCY_CATEGORIES } from '../../tech-categories'
import type { CompetencyCategory } from '../vocab-types'

const VALID_CATEGORIES = new Set<string>([
  'prog_languages', 'data_languages', 'libraries', 'dev_tools',
  'office_tools', 'comm_tools', 'ai_tools', 'vocabularies',
  'cloud', 'os', 'design', 'soft_skills', 'personal', 'domains',
])

const SUB_VOCABS = { TECH_VOCAB, DOMAIN_VOCAB, SOFT_SKILL_VOCAB, PERSONAL_VOCAB }

// ── Sub-vocab integrity ──────────────────────────────────────────────────────

describe('vocab integrity', () => {
  it('no duplicate keys within any sub-vocab', () => {
    for (const [name, vocab] of Object.entries(SUB_VOCABS)) {
      const keys = Object.keys(vocab)
      const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
      expect(dupes, `${name} has duplicate keys: ${dupes.join(', ')}`).toHaveLength(0)
    }
  })

  it('no duplicate keys across sub-vocabs', () => {
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const [name, vocab] of Object.entries(SUB_VOCABS)) {
      for (const key of Object.keys(vocab)) {
        if (seen.has(key)) {
          dupes.push(`"${key}" in both ${seen.get(key)} and ${name}`)
        } else {
          seen.set(key, name)
        }
      }
    }
    expect(dupes, `Cross-vocab duplicates:\n${dupes.join('\n')}`).toHaveLength(0)
  })

  it('all values are valid CompetencyCategory', () => {
    const invalid: string[] = []
    for (const [name, vocab] of Object.entries(SUB_VOCABS)) {
      for (const [key, val] of Object.entries(vocab)) {
        if (!VALID_CATEGORIES.has(val)) {
          invalid.push(`${name}["${key}"] = "${val}"`)
        }
      }
    }
    expect(invalid, `Invalid category values:\n${invalid.join('\n')}`).toHaveLength(0)
  })

  it('COMPETENCY_CATEGORIES equals union of all sub-vocabs', () => {
    const combined: Record<string, CompetencyCategory> = {
      ...TECH_VOCAB, ...DOMAIN_VOCAB, ...SOFT_SKILL_VOCAB, ...PERSONAL_VOCAB,
    }
    expect(Object.keys(COMPETENCY_CATEGORIES).sort()).toEqual(Object.keys(combined).sort())
    for (const [key, val] of Object.entries(combined)) {
      expect(COMPETENCY_CATEGORIES[key], `Key "${key}"`).toBe(val)
    }
  })
})

// ── YAML term coverage ───────────────────────────────────────────────────────

const YAML_PATH = resolve(process.cwd(), 'public/data/tyler-procko.yaml')
const TERM_FIELDS = ['technologies', 'domains', 'soft_skills', 'personal_skills'] as const
const SECTIONS = [
  'work_experiences', 'publications', 'projects', 'extracurriculars',
  'talks', 'courses', 'education', 'certificates',
] as const

interface YamlEntry {
  id?: string
  technologies?: string[]
  domains?: string[]
  soft_skills?: string[]
  personal_skills?: string[]
  [key: string]: unknown
}

interface YamlData {
  [section: string]: YamlEntry[] | undefined
}

describe('YAML term coverage', () => {
  const data = parseYaml(readFileSync(YAML_PATH, 'utf-8')) as YamlData

  it('all technologies/domains/soft_skills/personal_skills in YAML are mapped in COMPETENCY_CATEGORIES', () => {
    const unmapped: string[] = []
    for (const section of SECTIONS) {
      for (const entry of data[section] ?? []) {
        const id = entry.id ?? '(unknown)'
        for (const field of TERM_FIELDS) {
          for (const term of (entry[field] as string[] | undefined) ?? []) {
            if (!(term in COMPETENCY_CATEGORIES)) {
              unmapped.push(`[${field}] "${term}" (${id})`)
            }
          }
        }
      }
    }
    // Deduplicate
    const unique = [...new Set(unmapped)]
    expect(
      unique,
      `Unmapped terms — add to COMPETENCY_CATEGORIES:\n${unique.join('\n')}`,
    ).toHaveLength(0)
  })
})
