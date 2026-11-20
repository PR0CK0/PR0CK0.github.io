import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const app = readFileSync('src/App.tsx', 'utf8')
const routes = [...app.matchAll(/<Route\s+path="(\/[^"]*)"/g)].map(match => match[1]).filter(path => !path.includes(':')).sort()

it('includes every public route exactly once in the sitemap', () => {
  const sitemap = readFileSync('public/sitemap.xml', 'utf8')
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname)
  expect(routes.length).toBeGreaterThan(0)
  expect(paths.sort()).toEqual(routes)
})

it('prerenders every public route to its corresponding directory', () => {
  const script = readFileSync('scripts/prerender.mjs', 'utf8')
  const entries = [...script.matchAll(/\{\s*path:\s*'([^']+)',\s*dir:\s*'([^']*)'\s*\}/g)]
  expect(entries.map(match => match[1]).sort()).toEqual(routes)
  for (const [, path, dir] of entries) expect(dir).toBe(path.slice(1))
})
