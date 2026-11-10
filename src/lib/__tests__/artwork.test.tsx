import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { expect, it } from 'vitest'
import Personal from '../../pages/Personal'

it('serves all 54 drawings from the same files in both galleries', () => {
  const html = renderToStaticMarkup(<HelmetProvider><Personal /></HelmetProvider>)
  const modern = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(match => match[1])
  const legacyPath = 'public/legacy/personal/personal.html'
  const legacy = [...readFileSync(legacyPath, 'utf8').matchAll(/<img src='((?:pics\/|\/art\/)[^']+)'/g)]
    .map(match => match[1].startsWith('/') ? match[1] : `/legacy/personal/${match[1]}`)

  expect(modern).toHaveLength(54)
  expect(new Set(modern)).toEqual(new Set(legacy))
  for (const src of modern) {
    const image = readFileSync(resolve('public', src.slice(1)))
    expect(image.subarray(0, 8).toString('hex'), src).toBe('89504e470d0a1a0a')
  }
})
