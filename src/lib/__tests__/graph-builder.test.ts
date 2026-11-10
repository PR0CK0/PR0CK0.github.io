import { describe, it, expect } from 'vitest'
import { buildGraph } from '../graph-builder'
import { competencyNodeId, resolveCompetency } from '../competencies'
import type { Person } from '../schema'

describe('buildGraph', () => {
  it('omits cv_exclude projects and skills only they use', () => {
    const person = {
      id: 'person/x',
      name: 'X',
      projects: [
        { id: 'proj/shown', title: 'Shown', year: '2024', description: '', technologies: ['Python'] },
        { id: 'proj/hidden', title: 'Hidden', year: '2024', description: '', technologies: ['Rust'], cv_exclude: true },
      ],
    } as Person
    const ids = buildGraph(person).nodes.map((n) => n.data.id)
    expect(ids).toContain('proj/shown')
    expect(ids).not.toContain('proj/hidden')
    expect(ids.some((id) => id.toLowerCase().includes('rust'))).toBe(false)
  })
})


const competencyCases = [
  ['education', { id: 'education/test', degree: 'Degree', institution: 'University', field: 'Computing' }, 'education/test', false],
  ['work_experiences', { id: 'work/test', title: 'Engineer', organization: 'Organization' }, 'work/test', true],
  ['publications', { id: 'publication/test', title: 'Paper' }, 'publication/test', true],
  ['projects', { id: 'project/test', title: 'Project' }, 'project/test', true],
  ['courses', { number: 'TEST101', name: 'Course' }, 'course-test101', true],
  ['certificates', { id: 'certificate/test', title: 'Certificate' }, 'certificate/test', false],
  ['talks', { id: 'talk/test', title: 'Talk' }, 'talk/test', true],
  ['extracurriculars', { id: 'extra/test', title: 'Activity' }, 'extra/test', true],
] as const

describe('competency evidence coverage', () => {
  it.each(competencyCases)('links every supported competency field for %s, even when used nowhere else', (section, entry, source, supportsPersonal) => {
    const person = {
      id: 'person/test', name: 'Test',
      [section]: [{
        ...entry,
        technologies: ['SPARQL', 'SPARQL'], // repeated tags must not duplicate edges
        domains: ['Ontology'],
        soft_skills: ['Technical Writing'],
        ...(supportsPersonal ? { personal_skills: ['Telegram'] } : {}),
      }],
    } as Person
    const graph = buildGraph(person)
    const expectedTerms = ['SPARQL', 'Ontology', 'Technical Writing']
    if (supportsPersonal) expectedTerms.push('Telegram')
    const expectedTargets = expectedTerms.map(term => competencyNodeId(resolveCompetency(term)))
    expect(graph.edges.filter(edge => edge.data.source === source).map(edge => edge.data.target).sort())
      .toEqual(expectedTargets.sort())
    for (const target of expectedTargets) expect(graph.nodes.some(node => node.data.id === target)).toBe(true)
    const nodeIds = new Set(graph.nodes.map(node => node.data.id))
    expect(graph.edges.every(edge => nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target))).toBe(true)
  })

  it('does not create orphan competencies from excluded work or deprecated certificates', () => {
    const person = {
      id: 'person/test', name: 'Test',
      work_experiences: [{ id: 'work/hidden', title: 'Hidden', organization: 'Organization', graph_exclude: true, personal_skills: ['Telegram'] }],
      certificates: [{ id: 'certificate/old', title: 'Old', deprecated: true, technologies: ['SPARQL'], domains: ['Ontology'], soft_skills: ['Technical Writing'] }],
    } as Person
    expect(buildGraph(person)).toEqual({ nodes: [{ data: { id: 'person/test', label: 'Test', type: 'person', subtitle: undefined } }], edges: [] })
  })
})


describe('catalog-backed competency identity', () => {
  it('uses one canonical node and evidence edge when a term appears in different fields', () => {
    const person = {
      id: 'person/test', name: 'Test',
      projects: [{
        id: 'project/test', title: 'Project',
        technologies: ['Technical Writing'],
        domains: ['Technical Writing'],
        soft_skills: ['Technical Writing'],
      }],
    } as Person
    const graph = buildGraph(person)
    const terms = graph.nodes.filter(node => node.data.label === 'Technical Writing')
    expect(terms).toHaveLength(1)
    expect(terms[0].data).toMatchObject({ type: 'soft_skill', category: 'soft_skills' })
    expect(graph.edges.filter(edge => edge.data.source === 'project/test'))
      .toEqual([{ data: {
        id: `e-project/test-${terms[0].data.id}`,
        source: 'project/test', target: terms[0].data.id, type: 'softskill-usage',
      } }])
  })

  it('uses catalog categories even when separate records put the term in different fields', () => {
    const person = {
      id: 'person/test', name: 'Test',
      projects: [
        { id: 'project/one', title: 'One', technologies: ['NLP'] },
        { id: 'project/two', title: 'Two', domains: ['NLP'] },
      ],
    } as Person
    const graph = buildGraph(person)
    const terms = graph.nodes.filter(node => node.data.id === 'competency-nlp')
    expect(terms).toHaveLength(1)
    expect(terms[0].data).toMatchObject({ label: 'Natural Language Processing', type: 'domain', category: 'domains' })
    expect(graph.edges.filter(edge => edge.data.target === terms[0].data.id)
      .map(edge => edge.data.source).sort()).toEqual(['project/one', 'project/two'])
  })
})
