import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import cytoscape from 'cytoscape'

const effects = vi.hoisted(() => [] as Array<() => unknown>)
const stateChanges = vi.hoisted(() => vi.fn())
const route = vi.hoisted(() => ({ query: '' }))
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: (value: unknown) => [
    value === 'loading' ? 'ready' : Array.isArray(value) ? [{ data: { id: 'node', type: 'project' } }] : value,
    stateChanges,
  ],
  useRef: (value: unknown) => ({ current: value }),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => unknown) => { effects.push(effect) },
}))
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams(route.query)] }))
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
  stateChanges.mockClear()
  route.query = ''
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Graph link selection', () => {
  it.each([
    ['term=agile', 'competency-agile', 'Agile', 'domain'],
    ['q=Example', 'project/example', 'Example', 'project'],
  ])('matches a node click for %s, including details and highlighting', (query, id, label, type) => {
    vi.useFakeTimers()
    vi.stubGlobal('document', { body: { style: { overflow: '' } } })
    route.query = query
    const ready = cyCallback()
    const cy = cytoscape({
      headless: true, styleEnabled: true,
      elements: [
        { data: { id, label, type, description: 'Full record description' } },
        { data: { id: 'related', label: 'Related skill', type: 'skill' } },
        { data: { id: 'unrelated', label: 'Unrelated work', type: 'work' } },
        { data: { id: 'connection', source: id, target: 'related' } },
      ],
    })
    cores.push(cy)
    ready(cy)
    effects.forEach(effect => effect())
    const linkedSelection = stateChanges.mock.calls.find(([value]) => value?.id === id)?.[0]
    expect(linkedSelection).toBeDefined()
    expect(cy.getElementById(id).visible()).toBe(true)
    expect(cy.getElementById('related').visible()).toBe(true)
    expect(cy.getElementById('related').hasClass('neighbour')).toBe(true)
    expect(cy.getElementById('connection').hasClass('neighbour')).toBe(true)
    expect(cy.getElementById('unrelated').hasClass('faded')).toBe(true)
    const linkedClasses = cy.elements().map(element => element.classes())

    stateChanges.mockClear()
    cy.getElementById(id).emit('tap')
    const clickedSelection = stateChanges.mock.calls.find(([value]) => value?.id === id)?.[0]
    expect(linkedSelection).toEqual(clickedSelection)
    expect(linkedSelection.description).toBe('Full record description')
    expect(cy.elements().map(element => element.classes())).toEqual(linkedClasses)

    cy.emit('tap')
    expect(cy.elements('.faded, .neighbour')).toHaveLength(0)
    expect(cy.getElementById('related').visible()).toBe(false)
  })
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
