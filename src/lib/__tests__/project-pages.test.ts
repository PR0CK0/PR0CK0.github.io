import { expect, it } from 'vitest'
import { PersonSchema, ProjectSchema } from '../schema'
import { getVisibleProjects, projectPath } from '../project-pages'

const page = { slug: 'example', sections: [{ heading: 'The problem', paragraphs: ['A source-authored explanation.'] }] }

it('preserves authored page content and gives it a stable URL independent of its title', () => {
  const project = ProjectSchema.parse({ id: 'proj/example', title: 'Original', page })
  expect(project.page).toEqual(page)
  expect(projectPath(project)).toBe('/projects/example')
  expect(projectPath({ ...project, title: 'Renamed' })).toBe('/projects/example')
  expect(projectPath({ id: 'proj/brief', title: 'Brief entry' })).toBe('/projects/brief')
})

it('keeps the site visibility policy separate from CV exclusions', () => {
  expect(getVisibleProjects({ projects: [
    { id: 'proj/visible', title: 'Visible', cv_exclude: true },
    { id: 'proj/hidden', title: 'Hidden', graph_exclude: true, page },
  ] }).map(project => project.id)).toEqual(['proj/visible'])
})

it('rejects unsafe slugs, empty write-ups, unsafe resource links, and duplicate page URLs', () => {
  const project = { id: 'proj/example', title: 'Example', page }
  expect(ProjectSchema.safeParse({ ...project, page: { ...page, slug: '../graph' } }).success).toBe(false)
  expect(ProjectSchema.safeParse({ ...project, page: { ...page, sections: [] } }).success).toBe(false)
  expect(ProjectSchema.safeParse({ ...project, page: { ...page, links: [{ label: 'Link', url: 'javascript:alert(1)' }] } }).success).toBe(false)
  expect(PersonSchema.safeParse({ id: 'person/example', name: 'Example', projects: [project, { ...project, id: 'proj/other' }] }).success).toBe(false)
  expect(PersonSchema.safeParse({ id: 'person/example', name: 'Example', projects: [{ ...project, id: 'proj/alias' }, { id: 'proj/example', title: 'Default URL' }] }).success).toBe(false)
})
