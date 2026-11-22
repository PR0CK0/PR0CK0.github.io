import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import yaml from 'js-yaml'
import { PAGE_INPUTS, resolvePageUpdates, updateSitemap } from './page-updates.mjs'

const fixtures = []
const routes = {
  '/graph': { entry: 'src/pages/Graph.tsx', fields: ['publications'] },
  '/personal': { entry: 'src/pages/Personal.tsx', fields: [], assets: ['public/art/'] },
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'page-updates-'))
  fixtures.push(root)
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  const write = (path, content) => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), content)
  }
  const commit = day => {
    git('add', '.')
    const date = `2026-01-${String(day).padStart(2, '0')}T12:00:00Z`
    execFileSync('git', ['commit', '-qm', `Change ${day}`], {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_COMMITTER_NAME: 'Test',
        GIT_AUTHOR_EMAIL: 'test@example.invalid', GIT_COMMITTER_EMAIL: 'test@example.invalid',
        GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    })
    return git('rev-parse', 'HEAD')
  }
  git('init', '-q')
  write('index.html', '<html>Shared metadata</html>')
  write('src/pages/Graph.tsx', "import { label } from '@/lib/labels'\nexport default label")
  write('src/lib/labels.ts', "export const label = 'Graph'")
  write('src/pages/Personal.tsx', "export default 'Art'")
  write('public/art/drawing.png', 'image bytes')
  write('public/data/tyler-procko.yaml', 'name: Example\npublications: []\nhobbies: []\n')
  return { root, write, commit, git }
}

afterEach(() => fixtures.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })))

it('tracks update history for every public route', () => {
  const paths = [...readFileSync('src/App.tsx', 'utf8').matchAll(/<Route\s+path="(\/[^"]*)"/g)].map(match => match[1]).filter(path => !path.includes(':'))
  expect(Object.keys(PAGE_INPUTS).sort()).toEqual(paths.sort())
})

it('gives every prerendering workflow complete history without fetching old image blobs', () => {
  const directory = '.github/workflows'
  for (const name of readdirSync(directory).filter(name => name.endsWith('.yml'))) {
    const workflow = yaml.load(readFileSync(join(directory, name), 'utf8'))
    for (const job of Object.values(workflow.jobs)) {
      if (!job.steps?.some(step => step.run?.includes('npm run prerender'))) continue
      const checkout = job.steps.find(step => step.uses?.startsWith('actions/checkout@'))
      expect(checkout?.with, name).toMatchObject({ 'fetch-depth': 0, filter: 'blob:none' })
    }
  }
})

it('recovers dates, skips documentation and YAML formatting, and scopes data changes to relevant pages', () => {
  const { root, write, commit } = fixture()
  const original = commit(1)
  write('README.md', 'Documentation only')
  commit(2)
  write('public/data/tyler-procko.yaml', '# Comment\nhobbies: []\npublications: []\nname: Example\n')
  commit(3)
  expect(resolvePageUpdates(root, routes)['/graph']).toEqual({ modified: '2026-01-01T12:00:00.000Z', commit: original })
  write('public/data/tyler-procko.yaml', 'name: Example\npublications: [{title: New paper}]\nhobbies: []\n')
  const paper = commit(4)
  const updates = resolvePageUpdates(root, routes)
  expect(updates['/graph'].commit).toBe(paper)
  expect(updates['/personal'].commit).toBe(original)
  expect(resolvePageUpdates(root, routes)).toEqual(updates)
})

it('follows imported code, asset changes and shared metadata without a deployment timestamp', () => {
  const { root, write, commit } = fixture()
  const original = commit(1)
  write('src/lib/labels.ts', "export const label = 'Updated graph'")
  const graph = commit(2)
  expect(resolvePageUpdates(root, routes)['/graph'].commit).toBe(graph)
  expect(resolvePageUpdates(root, routes)['/personal'].commit).toBe(original)
  write('public/art/drawing.png', 'updated image')
  const art = commit(3)
  expect(resolvePageUpdates(root, routes)['/personal'].commit).toBe(art)
  expect(resolvePageUpdates(root, routes)['/graph'].commit).toBe(graph)
  write('index.html', '<html>Corrected shared metadata</html>')
  const shared = commit(4)
  expect(Object.values(resolvePageUpdates(root, routes)).map(item => item.commit)).toEqual([shared, shared])
})

it('counts a merge when changes land on the deployed branch and fails on shallow history', () => {
  const { root, write, commit, git } = fixture()
  commit(1)
  git('checkout', '-qb', 'feature')
  write('src/pages/Graph.tsx', "export default 'New graph'")
  commit(2)
  git('checkout', '-')
  write('README.md', 'Main branch update')
  commit(3)
  execFileSync('git', ['merge', '--no-ff', 'feature', '-m', 'Merge'], {
    cwd: root, env: { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_COMMITTER_NAME: 'Test',
      GIT_AUTHOR_EMAIL: 'test@example.invalid', GIT_COMMITTER_EMAIL: 'test@example.invalid',
      GIT_AUTHOR_DATE: '2026-01-04T12:00:00Z', GIT_COMMITTER_DATE: '2026-01-04T12:00:00Z' },
  })
  expect(resolvePageUpdates(root, routes)['/graph'].modified).toBe('2026-01-04T12:00:00.000Z')
  write('.git/shallow', git('rev-parse', 'HEAD') + '\n')
  expect(() => resolvePageUpdates(root, routes)).toThrow(/full Git history/)
})

it('writes recovered timestamps and rejects sitemap routes without tracking rules', () => {
  const source = '<urlset><url><loc>https://example.org/graph</loc><lastmod>2099-01-01</lastmod></url></urlset>'
  const updates = { '/graph': { modified: '2026-01-01T12:00:00.000Z', commit: 'example' } }
  expect(updateSitemap(source, updates)).toContain('<lastmod>2026-01-01T12:00:00.000Z</lastmod>')
  expect(updateSitemap(source.replace(/<lastmod>.*?<\/lastmod>/, ''), updates)).toContain('<lastmod>2026-01-01T12:00:00.000Z</lastmod>')
  expect(() => updateSitemap(source, {})).toThrow(/tracking rule/)
})

it('keeps each project detail date tied to its own source record', () => {
  const { root, write, commit } = fixture()
  write('public/data/tyler-procko.yaml', 'name: Example\nprojects: [{id: proj/one, title: One}, {id: proj/two, title: Two}]\n')
  const original = commit(1)
  const pages = Object.fromEntries(['one', 'two'].map(id => [`/projects/${id}`, { entry: 'src/pages/Graph.tsx', fields: [], projectId: `proj/${id}` }]))
  write('public/data/tyler-procko.yaml', 'name: Example\nprojects: [{id: proj/one, title: One}, {id: proj/two, title: Updated}]\n')
  const changed = commit(2)
  const updates = resolvePageUpdates(root, pages)
  expect(updates['/projects/one'].commit).toBe(original)
  expect(updates['/projects/two'].commit).toBe(changed)
})

it('tracks the graph worker as a graph-only runtime asset', () => {
  const { root, write, commit } = fixture()
  const tracked = { ...routes, '/graph': { ...routes['/graph'], assets: PAGE_INPUTS['/graph'].assets } }
  write('src/lib/graph-layout.worker.ts', 'original layout')
  const original = commit(1)
  write('src/lib/graph-layout.worker.ts', 'updated layout')
  const changed = commit(2)
  const updates = resolvePageUpdates(root, tracked)
  expect(updates['/graph'].commit).toBe(changed)
  expect(updates['/personal'].commit).toBe(original)
})

it('tracks transition code and its imported styles across pages', () => {
  const { root, write, commit } = fixture()
  write('src/components/PageTransition.tsx', "import './PageTransition.css'")
  write('src/components/PageTransition.css', 'original transition')
  commit(1)
  write('src/components/PageTransition.css', 'updated transition')
  const changed = commit(2)
  expect(Object.values(resolvePageUpdates(root, routes)).map(item => item.commit)).toEqual([changed, changed])
})

it('tracks locally served interface fonts across pages', () => {
  const { root, write, commit } = fixture()
  write('public/fonts/quantico/font.ttf', 'original font')
  commit(1)
  write('public/fonts/quantico/font.ttf', 'updated font')
  const changed = commit(2)
  expect(Object.values(resolvePageUpdates(root, routes)).map(item => item.commit)).toEqual([changed, changed])
})
