import { expect, it } from 'vitest'
import { projectRoutes } from './project-routes.mjs'
import { projectPath } from '../src/lib/project-pages'

it('redirects retired detail URLs to entries on the consolidated page', () => {
  const person = { projects: [
    { id: 'proj/brief', title: 'Brief' },
    { id: 'proj/long-id', title: 'Detailed', page: { slug: 'short', sections: [] } },
    { id: 'proj/hidden', title: 'Hidden', graph_exclude: true },
  ] }
  const routes = projectRoutes(person)
  expect(routes.map(route => route.target)).toEqual(person.projects.slice(0, 2).map(projectPath))
  expect(routes.map(route => route.dir)).toEqual(['projects/brief', 'projects/short'])
  expect(routes.map(route => route.projectId)).toEqual(['proj/brief', 'proj/long-id'])
})
