import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { expect, it } from 'vitest'
import PublicationIndex from '../PublicationIndex'

it('renders source authors, classification, venue and abstract, with external reading links', () => {
  const html = renderToString(<StaticRouter location="/papers"><PublicationIndex publications={[{
    id: 'pub/example', title: 'Source title', authors: ['Source author'], venue: 'Source venue',
    date: '2025-05', status: 'colleague_thesis', abstract: 'Source abstract.', url: 'https://example.org/paper',
  }]} /></StaticRouter>)
  for (const text of ['Source title', 'Source author', 'Source venue', 'Source abstract.', 'Colleague thesis', 'Search publications']) expect(html).toContain(text)
  expect(html).toContain('href="https://example.org/paper"')
  expect(html).toContain('href="/graph?term=pub%2Fexample"')
})

it('does not invent missing metadata, abstracts, or reading links', () => {
  const html = renderToString(<StaticRouter location="/papers"><PublicationIndex publications={[{ id: 'pub/brief', title: 'Brief' }]} /></StaticRouter>)
  expect(html).toContain('Brief')
  expect(html).not.toContain('Read publication')
  expect(html).not.toContain('Abstract')
  expect(html).not.toContain('undefined')
})
