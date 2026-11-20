import { readFileSync } from 'node:fs'
import { renderToString } from 'react-dom/server'
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async'
import { expect, it } from 'vitest'
import SEO from '../SEO'

it('leaves route-specific metadata to React instead of duplicating it in the HTML shell', () => {
  const html = readFileSync('index.html', 'utf8')
  expect(html).not.toMatch(/<link[^>]+rel="canonical"/)
  expect(html).not.toMatch(/<meta[^>]+(?:name|property)="(?:robots|description|og:title|og:description|og:url|twitter:title|twitter:description)"/)
})

it('keeps unavailable project pages out of search results', () => {
  const context: { helmet?: HelmetServerState } = {}
  renderToString(<HelmetProvider context={context}><SEO title="Missing" description="Missing project" path="/projects/missing" noindex /></HelmetProvider>)
  expect(context.helmet!.meta.toString()).toContain('name="robots" content="noindex, follow"')
})

it.each(['/', '/cv', '/graph'])('keeps search and sharing metadata consistent for %s', path => {
  const context: { helmet?: HelmetServerState } = {}
  const description = 'A specific description of this page.'
  renderToString(
    <HelmetProvider context={context}>
      <SEO title="Example page" description={description} path={path} />
    </HelmetProvider>,
  )
  const { title, meta, link } = context.helmet!
  const expectedTitle = path === '/' ? 'Example page' : 'Example page | procko.pro'
  expect(title.toString()).toContain(`>${expectedTitle}</title>`)
  expect(link.toString().match(/rel="canonical"/g)).toHaveLength(1)
  expect(link.toString()).toContain(`href="https://procko.pro${path}"`)
  for (const [attribute, name, content] of [
    ['name', 'description', description],
    ['property', 'og:title', expectedTitle],
    ['property', 'og:description', description],
    ['property', 'og:url', `https://procko.pro${path}`],
    ['name', 'twitter:title', expectedTitle],
    ['name', 'twitter:description', description],
  ]) {
    expect(meta.toString()).toContain(`${attribute}="${name}" content="${content}"`)
  }
})
