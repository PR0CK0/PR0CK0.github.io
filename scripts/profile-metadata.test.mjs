import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { expect, it } from 'vitest'
import { buildProfileMetadata } from './profile-metadata.mjs'

const html = readFileSync('index.html', 'utf8')
const template = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
const person = yaml.load(readFileSync('public/data/tyler-procko.yaml', 'utf8'))
const modified = '2026-11-19T00:00:00Z'

it('uses the selected work record and current YAML profile in structured metadata', () => {
  const output = buildProfileMetadata(template, person, modified)
  const profile = output['@graph'].find(node => node['@type'] === 'Person')
  const work = person.work_experiences.find(item => item.id === person.primary_work_experience)
  expect(work.organization).toBe('Apacen')
  expect(profile.worksFor).toEqual({ '@type': 'Organization', name: work.organization, url: work.org_url })
  expect(profile.name).toBe(person.name)
  expect(profile.jobTitle).toBe(person.title.split(' — ')[0])
  expect(profile.description).toBe(person.summary)
  expect(profile.sameAs).toEqual(person.social_links.map(link => link.url))
  expect(output['@graph'].find(node => node['@type'] === 'ProfilePage').dateModified).toBe(modified)
  expect(output['@graph'].find(node => node['@type'] === 'WebSite').description).toBe(person.seo_description)
})

it('follows edits to the selected employer without inferring from record order', () => {
  const changed = structuredClone(person)
  const work = changed.work_experiences.find(item => item.id === changed.primary_work_experience)
  work.organization = 'Updated employer'
  work.org_url = 'https://example.org/'
  changed.work_experiences.reverse()
  const output = buildProfileMetadata(template, changed, modified)
  expect(output['@graph'].find(node => node['@type'] === 'Person').worksFor).toEqual({
    '@type': 'Organization', name: 'Updated employer', url: 'https://example.org/',
  })
  expect(template['@graph'].find(node => node['@type'] === 'Person')).not.toHaveProperty('worksFor')
})

it('rejects a missing or ended primary work record', () => {
  expect(() => buildProfileMetadata(template, { ...person, primary_work_experience: 'work/missing' }, modified)).toThrow('primary_work_experience')
  const changed = structuredClone(person)
  changed.work_experiences.find(item => item.id === changed.primary_work_experience).is_current = false
  expect(() => buildProfileMetadata(template, changed, modified)).toThrow('primary_work_experience')
  changed.work_experiences.find(item => item.id === changed.primary_work_experience).is_current = true
  changed.work_experiences.find(item => item.id === changed.primary_work_experience).end_date = '2026-06'
  expect(() => buildProfileMetadata(template, changed, modified)).toThrow('primary_work_experience')
})

it('keeps generated profile fields out of the HTML template', () => {
  const profile = template['@graph'].find(node => node['@type'] === 'Person')
  for (const field of ['worksFor', 'name', 'jobTitle', 'description', 'email', 'sameAs', 'identifier']) {
    expect(profile).not.toHaveProperty(field)
  }
})
