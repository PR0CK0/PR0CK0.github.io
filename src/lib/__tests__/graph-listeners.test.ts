import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import cytoscape from 'cytoscape'

const effects = vi.hoisted(() => [] as Array<() => unknown>)
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: (value: unknown) => [
    value === 'loading' ? 'ready' : Array.isArray(value) ? [{ data: { id: 'node', type: 'project' } }] : value,
    vi.fn(),
  ],
  useRef: (value: unknown) => ({ current: value }),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => unknown) => { effects.push(effect) },
}))
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }))
vi.mock('../useIsLightMode', () => ({ useIsLightMode: () => false }))
vi.mock('react-cytoscapejs', () => ({ default: () => null }))
vi.mock('@/components/SEO', () => ({ default: () => null }))
import Graph from '@/pages/Graph'

// Find the actual cy callback supplied by Graph, without mounting the canvas.
function cyCallback() {
  const pending: unknown[] = [Graph()]
  while (pending.length) {
    const node = pending.pop() as ReactElement<{ cy?: (cy: cytoscape.Core) => void; children?: unknown }>
    if (!node || typeof node !== 'object') continue
    if (node.props?.cy) return node.props.cy
    const children = node.props?.children
    if (Array.isArray(children)) pending.push(...children.flat(Infinity))
    else if (children) pending.push(children)
  }
  throw new Error('Graph must supply a Cytoscape ready callback')
}

const cores: cytoscape.Core[] = []
afterEach(() => {
  cores.forEach(cy => cy.destroy())
  cores.length = 0
  effects.length = 0
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Graph listener lifecycle', () => {
  it('does not register another set when the wrapper updates the same core', () => {
    const ready = cyCallback()
    const cy = cytoscape({ headless: true }); cores.push(cy)
    const on = vi.spyOn(cy, 'on')
    ready(cy)
    const registrations = on.mock.calls.length
    expect(registrations).toBe(4)
    ready(cy)
    ready(cy)
    expect(on.mock.calls.length).toBe(registrations)
  })

  it('removes only its own handlers when replacing the core or unmounting', () => {
    vi.useFakeTimers()
    vi.stubGlobal('document', { body: { style: { overflow: '' } } })
    const ready = cyCallback()
    const first = cytoscape({ headless: true }); cores.push(first)
    const second = cytoscape({ headless: true }); cores.push(second)
    const externalTap = vi.fn()
    first.on('tap', externalTap)
    const firstOn = vi.spyOn(first, 'on')
    const firstOff = vi.spyOn(first, 'off')
    ready(first)
    const cleanups = effects.map(effect => effect()).filter(value => typeof value === 'function') as Array<() => void>
    ready(second)
    expect(firstOff.mock.calls).toEqual(firstOn.mock.calls)
    first.emit('tap')
    expect(externalTap).toHaveBeenCalledOnce()
    const secondOff = vi.spyOn(second, 'off')
    cleanups.forEach(cleanup => cleanup())
    expect(secondOff).toHaveBeenCalledTimes(4)
  })
})
