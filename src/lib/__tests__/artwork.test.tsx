import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { StaticRouter } from 'react-router-dom/server'
import { expect, it } from 'vitest'
import Personal from '../../pages/Personal'

it('redirects the retired gallery address to the existing gallery without JavaScript', () => {
  const html = readFileSync('public/personal/personal.html', 'utf8')
  const target = '/legacy/personal/personal.html'
  expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${target}">`)
  expect(html).toContain(`<link rel="canonical" href="${target}">`)
  expect(html).toContain(`<a href="${target}">`)
  expect(html).not.toContain('<script')
  expect(readFileSync(resolve('public', target.slice(1)), 'utf8')).toContain('/art/')
})

it('makes all drawings labeled buttons that can open a dialog from the keyboard', () => {
  const html = renderToStaticMarkup(<StaticRouter location="/personal"><HelmetProvider><Personal /></HelmetProvider></StaticRouter>)
  const buttons = [...html.matchAll(/<button([^>]*aria-haspopup="dialog"[^>]*)>([\s\S]*?)<\/button>/g)]
  expect(buttons).toHaveLength(54)
  for (const [, attributes, content] of buttons) {
    expect(attributes).toContain('type="button"')
    const label = content.match(/alt="([^"]+)"/)?.[1]
    expect(label).toBeTruthy()
    expect(attributes).toContain(`aria-label="Open ${label}"`)
  }
})

it('serves all 54 drawings from the same files in both galleries', () => {
  const html = renderToStaticMarkup(<StaticRouter location="/personal"><HelmetProvider><Personal /></HelmetProvider></StaticRouter>)
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
