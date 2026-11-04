import { describe, expect, it } from 'vitest'
import { countTechOccurrences, groupSkills } from '../cv-data'
import { aggregateCompetencies } from '../competencies'
import { COMPETENCY_CATEGORY_LABELS } from '../tech-categories'
import type { Person } from '../schema'

const evidenceSections = [
  'education', 'work_experiences', 'publications', 'projects',
  'courses', 'certificates', 'talks', 'extracurriculars',
] as const

describe('CV competency counts', () => {
  it.each(evidenceSections)('includes technology and soft-skill evidence from %s', section => {
    const person = {
      id: 'person/test', name: 'Test',
      [section]: [{ id: `${section}/test`, technologies: ['SPARQL'], soft_skills: ['Technical Writing'] }],
    } as Person

    const counts = countTechOccurrences(person)
    expect(counts.get('SPARQL')).toBe(1)
    expect(counts.get('Technical Writing')).toBe(1)
  })

  it('counts supporting records rather than repeated tags', () => {
    const person = {
      id: 'person/test', name: 'Test',
      projects: [
        { id: 'project/one', title: 'One', technologies: ['SPARQL', 'SPARQL'], soft_skills: ['Technical Writing', 'Technical Writing'] },
        { id: 'project/two', title: 'Two', technologies: ['SPARQL'], soft_skills: ['Technical Writing'] },
      ],
    } as Person

    const counts = countTechOccurrences(person)
    expect(counts.get('SPARQL')).toBe(2)
    expect(counts.get('Technical Writing')).toBe(2)
  })
})

describe('shared competency evidence', () => {
  it('uses one canonical name for IDs, labels, and case/whitespace variants', () => {
    const seed = {
      id: 'person/test', name: 'Test',
      projects: [{ id: 'project/seed', title: 'Seed', technologies: ['SPARQL'] }],
    } as Person
    const canonicalId = aggregateCompetencies(seed).find(item => item.name === 'SPARQL')!.id
    const person = {
      id: 'person/test', name: 'Test',
      projects: [
        { id: 'project/one', title: 'One', technologies: [canonicalId, 'SPARQL', ' sparql '] },
        { id: 'project/two', title: 'Two', technologies: ['Sparql'] },
      ],
    } as Person

    expect(countTechOccurrences(person)).toEqual(new Map([['SPARQL', 2]]))
    expect(groupSkills(countTechOccurrences(person))[COMPETENCY_CATEGORY_LABELS.data_languages])
      .toEqual(['SPARQL'])
  })

  it('has identical evidence counts to the shared site aggregate', () => {
    const person = {
      id: 'person/test', name: 'Test',
      education: [{ id: 'education/test', degree: 'Degree', institution: 'University', technologies: ['SPARQL'], soft_skills: ['Technical Writing'] }],
      certificates: [{ id: 'certificate/test', title: 'Certificate', technologies: ['SPARQL'] }],
      projects: [{ id: 'project/test', title: 'Project', technologies: ['SPARQL'], domains: ['Ontology'], personal_skills: ['Telegram'] }],
    } as Person

    expect(countTechOccurrences(person)).toEqual(new Map(
      aggregateCompetencies(person).map(item => [item.name, item.count]),
    ))
    expect(countTechOccurrences(person).get('SPARQL')).toBe(3)
  })

  it('omits evidence excluded by the shared visibility policy', () => {
    const person = {
      id: 'person/test', name: 'Test',
      projects: [{ id: 'project/hidden', title: 'Hidden', cv_exclude: true, technologies: ['SPARQL'] }],
      work_experiences: [{ id: 'work/hidden', title: 'Hidden', organization: 'Org', graph_exclude: true, soft_skills: ['Technical Writing'] }],
      certificates: [{ id: 'certificate/old', title: 'Old', deprecated: true, technologies: ['Python'] }],
    } as Person

    expect(countTechOccurrences(person).size).toBe(0)
    expect(groupSkills(countTechOccurrences(person))).toEqual({})
  })
})

describe('CV skill groups', () => {
  it('retains supported soft skills while keeping CV category exclusions', () => {
    const groups = groupSkills(new Map([
      ['SPARQL', 2], ['Technical Writing', 1], ['Telegram', 1],
      ['Ontology', 1], ['Linux', 1],
    ]))

    expect(groups[COMPETENCY_CATEGORY_LABELS.data_languages]).toEqual(['SPARQL'])
    expect(groups[COMPETENCY_CATEGORY_LABELS.soft_skills]).toEqual(['Technical Writing'])
    expect(Object.values(groups).flat()).toEqual(expect.not.arrayContaining(['Telegram', 'Ontology', 'Linux']))
  })

  it('orders observed skills by support count and omits unused vocabulary terms', () => {
    const groups = groupSkills(new Map([['Python', 1], ['JavaScript', 3]]))
    expect(groups[COMPETENCY_CATEGORY_LABELS.prog_languages]).toEqual(['JavaScript', 'Python'])
  })
})
