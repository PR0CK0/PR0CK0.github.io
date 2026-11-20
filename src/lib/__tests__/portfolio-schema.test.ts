import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'
import { PersonSchema, ProjectSchema, ExtracurricularSchema } from '../schema'

it('preserves positive stable GitHub repository IDs on projects and contributions', () => {
  for (const schema of [ProjectSchema, ExtracurricularSchema]) {
    const record = { id: 'example', title: 'Example', github_repo_id: 42 }
    expect(schema.parse(record).github_repo_id).toBe(42)
    for (const invalid of [0, -1, 1.5, '42']) {
      expect(schema.safeParse({ ...record, github_repo_id: invalid }).success).toBe(false)
    }
  }
})

it('validates the complete portfolio and gives every social link a unique, nonempty ID', () => {
  const person = PersonSchema.parse(load(readFileSync('public/data/tyler-procko.yaml', 'utf8')))
  const links = [
    ...(person.social_links ?? []),
    ...(person.associates ?? []).flatMap(associate => associate.social_links ?? []),
  ]
  const ids = links.map(link => link.id)
  expect(ids.length).toBeGreaterThan(0)
  expect(ids.every(id => id.trim().length > 0)).toBe(true)
  expect(new Set(ids).size).toBe(ids.length)
})
