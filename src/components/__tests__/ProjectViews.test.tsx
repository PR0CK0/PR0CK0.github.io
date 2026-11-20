import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { expect, it } from 'vitest'
import { ProjectDetail, ProjectIndex } from '../ProjectViews'
import type { Project } from '@/lib/schema'

const project: Project = {
  id: 'proj/example', title: 'Source title', description: 'Source description.', year: '2026-02',
  technologies: ['Python'], domains: ['Knowledge Graphs'], repo_url: 'https://example.org/repository',
  page: { slug: 'example', sections: [{ heading: 'Source heading', paragraphs: ['Source paragraph.'] }] },
}

it('links every indexed project to its own page, including records without extra prose', () => {
  const html = renderToString(<StaticRouter location="/projects"><ProjectIndex projects={[project, { id: 'proj/brief', title: 'Brief' }]} /></StaticRouter>)
  expect(html).toContain('href="/projects/example"')
  expect(html).toContain('href="/projects/brief"')
  expect(html).toContain('Source description.')
  expect(html.match(/Project notes ↘/g)).toHaveLength(2)
  expect(html).toContain('Sort projects')
})

it('renders source content, canonical competency labels, and project resource links', () => {
  const html = renderToString(<StaticRouter location="/projects/example"><ProjectDetail project={project} /></StaticRouter>)
  for (const text of ['Source title', 'Source description.', 'Source heading', 'Source paragraph.', 'Python', 'Knowledge Graphs']) expect(html).toContain(text)
  expect(html).toContain('href="https://example.org/repository"')
  expect(html).toContain('href="/graph?term=proj%2Fexample"')
})

it('renders a brief record without empty section headings or invented content', () => {
  const html = renderToString(<StaticRouter location="/"><ProjectDetail project={{ id: 'proj/brief', title: 'Brief' }} /></StaticRouter>)
  expect(html).toContain('Brief')
  expect(html).not.toContain('undefined')
  expect(html).not.toContain('Overview')
})
