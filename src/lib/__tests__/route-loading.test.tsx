import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { expect, it, vi } from 'vitest'

const loaded = vi.hoisted(() => [] as string[])
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div><nav>Navigation</nav>{children}</div> }))
vi.mock('@/pages/Landing', () => ({ default: () => <h1>Home</h1> }))
vi.mock('@/pages/Graph', () => {
  loaded.push('/graph')
  return { default: () => <h1>Graph</h1> }
})
vi.mock('@/pages/CVExport', () => {
  loaded.push('/cv')
  return { default: () => <h1>CV</h1> }
})
vi.mock('@/pages/ResumeExport', () => {
  loaded.push('/resume')
  return { default: () => <h1>Resume</h1> }
})

import App from '../../App'

it('loads graph and PDF pages only when selected, keeping navigation available while loading', async () => {
  const home = renderToString(<StaticRouter location="/"><App /></StaticRouter>)
  expect(home).toContain('<h1>Home</h1>')
  expect(loaded).toEqual([])

  for (const [path, title] of [['/graph', 'Graph'], ['/cv', 'CV'], ['/resume', 'Resume']]) {
    const pending = renderToString(<StaticRouter location={path}><App /></StaticRouter>)
    expect(pending).toContain('<nav>Navigation</nav>')
    expect(pending).toContain('role="status"')
    await vi.waitFor(() => expect(loaded).toContain(path))
    const ready = renderToString(<StaticRouter location={path}><App /></StaticRouter>)
    expect(ready).toContain(`<h1>${title}</h1>`)
    expect(loaded.filter(route => route === path)).toHaveLength(1)
  }
})
