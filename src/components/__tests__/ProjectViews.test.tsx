import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { expect, it } from 'vitest'
import { ProjectIndex } from '../ProjectViews'
import type { Project } from '@/lib/schema'

const project: Project = {
  id: 'proj/example', title: 'Source title', description: 'Source description.', year: '2026-02',
  technologies: ['Python'], domains: ['Knowledge Graphs'], repo_url: 'https://example.org/repository',
  page: { slug: 'example', sections: [{ heading: 'Source heading', paragraphs: ['Source paragraph.'] }] },
}

it('renders projects together with expandable summaries and direct resource links', () => {
  const html = renderToString(<StaticRouter location="/projects"><ProjectIndex projects={[project, { id: 'proj/brief', title: 'Brief' }]} /></StaticRouter>)
  expect(html).toContain('id="example"')
  expect(html).toContain('<summary')
  for (const text of ['Source title', 'Source description.', 'Source paragraph.', 'Python', 'Knowledge Graphs']) expect(html).toContain(text)
  expect(html).toContain('href="https://example.org/repository"')
  expect(html).toContain('href="/graph?term=proj%2Fexample"')
  expect(html).not.toContain('href="/projects/')
  expect(html).not.toContain('View project')
  expect(html).toContain('Sort projects')
})

it('renders a brief record without empty summaries or invented content', () => {
  const html = renderToString(<StaticRouter location="/projects"><ProjectIndex projects={[{ id: 'proj/brief', title: 'Brief' }]} /></StaticRouter>)
  expect(html).toContain('Brief')
  expect(html).not.toContain('undefined')
  expect(html).not.toContain('<details')
})
