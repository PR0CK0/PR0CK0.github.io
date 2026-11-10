import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import {
  createCompetencyResolver, resolveCompetency, competencyNodeId,
  getRecordCompetencies, aggregateCompetencies, type Competency,
} from '../competencies'
import { buildGraph } from '../graph-builder'
import { countTechOccurrences, groupSkills } from '../cv-data'
import type { Person } from '../schema'

const term: Competency = {
  id: 'query-language', label: 'SPARQL', category: 'data_languages', aliases: ['Query language'],
}

describe('competency catalog', () => {
  it('resolves IDs, names, and aliases with consistent normalization', () => {
    const resolve = createCompetencyResolver([term])
    for (const value of ['query-language', 'SPARQL', ' sparql ', 'QUERY LANGUAGE']) {
      expect(resolve(value)).toEqual(term)
    }
    expect(() => resolve('unknown')).toThrow(/Unknown competency/)
  })

  it('keeps node identity when the display name changes', () => {
    const renamed = { ...term, label: 'New name', aliases: ['SPARQL'] }
    expect(competencyNodeId(createCompetencyResolver([renamed])('SPARQL')))
      .toBe(competencyNodeId(term))
  })

  it('rejects duplicate IDs and ambiguous names or aliases', () => {
    expect(() => createCompetencyResolver([term, { ...term, label: 'Other' }])).toThrow()
    expect(() => createCompetencyResolver([term, { ...term, id: 'other' }])).toThrow()
    expect(() => createCompetencyResolver([term, {
      id: 'other', label: 'Other', category: 'domains', aliases: [' sparql '],
    }])).toThrow()
    expect(() => createCompetencyResolver([{ ...term, aliases: ['SPARQL'] }])).toThrow()
    expect(() => createCompetencyResolver([{ ...term, category: 'invalid' } as unknown as Competency])).toThrow()
  })

  it('allows a label to equal its own ID and rejects empty references', () => {
    expect(createCompetencyResolver([{ ...term, id: 'sparql', aliases: [] }])('SPARQL').id).toBe('sparql')
    expect(() => createCompetencyResolver([{ ...term, id: '' }])).toThrow()
  })

  it('requires lowercase stable IDs and an explicit alias list', () => {
    for (const id of ['SPARQL', ' sparql ', 'two words', '-sparql', 'sparql-']) {
      expect(() => createCompetencyResolver([{ ...term, id }])).toThrow()
    }
    const { aliases: _, ...missingAliases } = term
    expect(() => createCompetencyResolver([missingAliases as Competency])).toThrow()
  })

  it('deduplicates all fields by identity and uses the catalog category', () => {
    const terms = getRecordCompetencies({
      technologies: ['technical-writing'], domains: ['Technical Writing'], soft_skills: [' technical writing '],
    })
    expect(terms).toEqual([resolveCompetency('Technical Writing')])
    expect(terms[0].category).toBe('soft_skills')
    expect(resolveCompetency('Telegram').category).toBe('personal')
  })
})

describe.each([
  {
    name: 'Natural Language Processing', id: 'nlp',
    references: ['NLP', 'nlp', 'Natural Language Processing', 'natural-language-processing'],
  },
  {
    name: 'Retrieval-Augmented Generation', id: 'retrieval-augmented-generation',
    references: ['RAG', 'rag', 'Retrieval-Augmented Generation', 'retrieval-augmented-generation'],
  },
  {
    name: 'Named Entity Recognition', id: 'ner',
    references: ['NER', 'ner', 'Named Entity Recognition'],
  },
])('$name identity', ({ name, id, references }) => {
  const person = {
    id: 'person/test', name: 'Test', projects: [
      { id: 'project/one', title: 'One', domains: references },
      { id: 'project/two', title: 'Two', domains: [name] },
    ],
  } as Person

  it('resolves both names and existing link IDs to the retained node', () => {
    for (const reference of references) {
      const resolved = resolveCompetency(reference)
      expect(resolved).toMatchObject({ id, label: name, category: 'domains' })
      expect(competencyNodeId(resolved)).toBe(`competency-${id}`)
    }
  })

  it('combines supporting records without double-counting aliases', () => {
    expect(aggregateCompetencies(person)).toEqual([
      { id, name, category: 'domains', count: 2 },
    ])
    const graph = buildGraph(person)
    expect(graph.nodes.filter(node => node.data.type === 'domain')).toEqual([
      { data: { id: `competency-${id}`, label: name, category: 'domains', type: 'domain' } },
    ])
    expect(graph.edges.filter(edge => edge.data.target === `competency-${id}`)
      .map(edge => edge.data.source).sort()).toEqual(['project/one', 'project/two'])
  })

  it('follows the existing CV policy of excluding domains from skill groups', () => {
    const counts = countTechOccurrences(person)
    expect(counts.get(name)).toBe(2)
    expect(groupSkills(counts)).toEqual({})
  })
})

describe('portfolio evidence', () => {
  const person = load(readFileSync('public/data/tyler-procko.yaml', 'utf8')) as Person

  it('resolves every reference in every record, including excluded records', () => {
    for (const section of ['education', 'work_experiences', 'publications', 'projects', 'courses', 'certificates', 'talks', 'extracurriculars'] as const) {
      for (const entry of person[section] ?? []) expect(() => getRecordCompetencies(entry)).not.toThrow()
    }
  })

  it('matches graph evidence counts for every observed competency', () => {
    const graph = buildGraph(person)
    for (const term of aggregateCompetencies(person)) {
      expect(graph.edges.filter(edge => edge.data.target === competencyNodeId(resolveCompetency(term.id))).length, term.name)
        .toBe(term.count)
    }
  })

  it('does not let record order decide categories or counts', () => {
    const reversed = { ...person, projects: [...(person.projects ?? [])].reverse() }
    expect(aggregateCompetencies(reversed)).toEqual(aggregateCompetencies(person))
  })
})
