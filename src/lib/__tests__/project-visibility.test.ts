import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'
import { aggregateCompetencies, COMPETENCY_CATEGORY_LABELS } from '../competencies'
import { buildGraph } from '../graph-builder'
import { buildCVData, buildResumeData } from '../cv-data'
import { ProjectSchema, type Person } from '../schema'

const person = {
  id: 'person/test', name: 'Test',
  projects: [
    { id: 'project/personal', title: 'Personal work', cv_exclude: true, personal_skills: ['Element'] },
    { id: 'project/hidden', title: 'Hidden on site', graph_exclude: true, technologies: ['Rust'] },
  ],
} as Person

it('preserves independent project visibility flags when parsing data', () => {
  expect(ProjectSchema.parse(person.projects![1])).toMatchObject({ graph_exclude: true })
  expect(ProjectSchema.parse(person.projects![0])).toMatchObject({ cv_exclude: true })
})

it('includes CV-excluded projects on the site but omits graph-excluded evidence', () => {
  const graph = buildGraph(person)
  expect(graph.nodes.map(n => n.data.id)).toContain('project/personal')
  expect(graph.nodes.map(n => n.data.id)).not.toContain('project/hidden')
  expect(aggregateCompetencies(person)).toEqual([
    { id: 'element', name: 'Element', category: 'personal', count: 1 },
  ])
})

it.each([buildCVData, buildResumeData])('keeps personal projects and skills out of document exports', build => {
  const document = build(person, '2026-11-10')
  const projects = document.sections.find(section => section.header.startsWith('Projects'))?.entries ?? []
  expect(projects.map(project => project.title)).toEqual(['Hidden on site'])
  const skillGroups = document.sections.flatMap(section => Object.values(section.skillGroups ?? {})).flat()
  expect(skillGroups).not.toContain('Element')
})

it('shows 19 personal tools while Telegram belongs only to the Wikidata project', () => {
  const portfolio = load(readFileSync('public/data/tyler-procko.yaml', 'utf8')) as Person
  const graph = buildGraph(portfolio)
  const terms = aggregateCompetencies(portfolio)
  const personal = terms.filter(term => term.category === 'personal')
  expect(COMPETENCY_CATEGORY_LABELS.personal).toBe('Personal & Creative Use')
  expect(personal).toHaveLength(19)
  for (const term of personal) {
    expect(graph.edges.filter(edge => edge.data.target === `competency-${term.id}`)
      .map(edge => edge.data.source)).toEqual(['proj/personal'])
  }
  expect(terms.find(term => term.id === 'telegram'))
    .toMatchObject({ category: 'comm_tools', count: 1 })
  expect(graph.edges.filter(edge => edge.data.target === 'competency-telegram')
    .map(edge => edge.data.source)).toEqual(['proj/wikidata-ontology---christian-denominations-reconciliation'])
  const hidden = portfolio.projects!.filter(project => project.cv_exclude && project.id !== 'proj/personal')
  expect(hidden).toHaveLength(5)
  for (const project of hidden) {
    expect(project.graph_exclude).toBe(true)
    expect(graph.nodes.some(node => node.data.id === project.id)).toBe(false)
  }
  const personalNames = personal.map(term => term.name)
  for (const build of [buildCVData, buildResumeData]) {
    const document = build(portfolio, '2026-11-10')
    expect(document.sections.find(section => section.header.startsWith('Projects'))?.entries
      ?.map(project => project.title)).not.toContain('Personal & Creative Work')
    expect(document.sections.flatMap(section => Object.values(section.skillGroups ?? {})).flat()
      .filter(name => personalNames.includes(name))).toEqual([])
  }
})
