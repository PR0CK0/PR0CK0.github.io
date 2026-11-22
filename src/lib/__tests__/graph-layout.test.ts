import { afterEach, expect, it, vi } from 'vitest'
import cytoscape from 'cytoscape'
import { startGraphLayout } from '../graph-layout'

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: ((event: { message: string; preventDefault: () => void }) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
}

const cores: cytoscape.Core[] = []
afterEach(() => {
  cores.forEach(cy => cy.destroy())
  cores.length = 0
  vi.unstubAllGlobals()
})

it('terminates layout work on cancellation and ignores a late result', () => {
  const worker = new FakeWorker()
  vi.stubGlobal('Worker', vi.fn(() => worker))
  const cy = cytoscape({ headless: true, elements: [{ data: { id: 'a' } }] })
  cores.push(cy)
  const done = vi.fn(), error = vi.fn()
  const cancel = startGraphLayout(cy, done, error)
  expect(worker.postMessage).toHaveBeenCalledOnce()
  const receive = worker.onmessage!
  cancel()
  receive({ data: { positions: { a: { x: 10, y: 20 } } } })
  expect(worker.terminate).toHaveBeenCalledOnce()
  expect(done).not.toHaveBeenCalled()
  expect(error).not.toHaveBeenCalled()
})

it('returns positions once and releases the finished worker', () => {
  const worker = new FakeWorker()
  vi.stubGlobal('Worker', vi.fn(() => worker))
  const cy = cytoscape({ headless: true, elements: [{ data: { id: 'a' } }] })
  cores.push(cy)
  const done = vi.fn()
  const cancel = startGraphLayout(cy, done, vi.fn())
  const positions = { a: { x: 10, y: 20 } }
  worker.onmessage!({ data: { positions } })
  expect(done).toHaveBeenCalledOnce()
  expect(done).toHaveBeenCalledWith(positions)
  cancel()
  expect(worker.terminate).toHaveBeenCalledOnce()
})

it('reports a worker failure without leaving background work running', () => {
  const worker = new FakeWorker()
  vi.stubGlobal('Worker', vi.fn(() => worker))
  const cy = cytoscape({ headless: true })
  cores.push(cy)
  const error = vi.fn()
  startGraphLayout(cy, vi.fn(), error)
  worker.onerror!({ message: 'Layout failed', preventDefault: vi.fn() })
  expect(error).toHaveBeenCalledWith('Layout failed')
  expect(worker.terminate).toHaveBeenCalledOnce()
})

it('computes finite positions for connected and isolated nodes inside the worker', async () => {
  const scope = { onmessage: null as unknown as (event: { data: unknown }) => void, postMessage: vi.fn() }
  vi.stubGlobal('self', scope)
  await import('../graph-layout.worker')
  scope.onmessage({ data: { elements: [
    ...['a', 'b', 'isolated'].map(id => ({ data: { id, layoutWidth: 50, layoutHeight: 40 } })),
    { data: { id: 'ab', source: 'a', target: 'b' } },
  ] } })
  const result = scope.postMessage.mock.calls[0][0]
  expect(result.error).toBeUndefined()
  expect(Object.keys(result.positions).sort()).toEqual(['a', 'b', 'isolated'])
  for (const position of Object.values(result.positions) as Array<{ x: number; y: number }>) {
    expect(Number.isFinite(position.x) && Number.isFinite(position.y)).toBe(true)
  }
  expect(result.positions.a).not.toEqual(result.positions.b)
})
