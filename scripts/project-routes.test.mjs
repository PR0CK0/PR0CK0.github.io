import { expect, it } from 'vitest'
import { projectRoutes } from './project-routes.mjs'
import { projectPath } from '../src/lib/project-pages'

it('generates a concrete route for every visible source record and agrees with browser links', () => {
  const person = { projects: [
    { id: 'proj/brief', title: 'Brief' },
    { id: 'proj/long-id', title: 'Detailed', page: { slug: 'short', sections: [] } },
    { id: 'proj/hidden', title: 'Hidden', graph_exclude: true },
  ] }
  const routes = projectRoutes(person)
  expect(routes.map(route => route.path)).toEqual(person.projects.slice(0, 2).map(projectPath))
  expect(routes.map(route => route.dir)).toEqual(['projects/brief', 'projects/short'])
  expect(routes.map(route => route.projectId)).toEqual(['proj/brief', 'proj/long-id'])
})
