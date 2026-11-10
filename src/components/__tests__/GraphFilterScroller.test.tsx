import { afterEach, expect, it, vi } from 'vitest'

const harness = vi.hoisted(() => ({
  effects: [] as Array<() => (() => void)>,
  refs: [] as Array<{ current: unknown }>,
  edges: { left: false, right: false },
}))
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useRef: () => {
    const ref = { current: null }
    harness.refs.push(ref)
    return ref
  },
  useEffect: (effect: () => (() => void)) => harness.effects.push(effect),
  useState: (value: typeof harness.edges) => [value, (update: (previous: typeof value) => typeof value) => {
    harness.edges = update(harness.edges)
  }],
}))
import GraphFilterScroller from '../GraphFilterScroller'

const cleanups: Array<() => void> = []
afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup())
  harness.effects.length = 0
  harness.refs.length = 0
  harness.edges = { left: false, right: false }
  vi.unstubAllGlobals()
})

function mount(width = 100, contentWidth = 400) {
  let resize = () => {}
  const disconnect = vi.fn()
  const observe = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe = observe
    disconnect = disconnect
  })
  GraphFilterScroller({ backgroundColor: '#000', hintColor: '#fff', children: null })
  const element = Object.assign(new EventTarget(), {
    clientWidth: width, scrollWidth: contentWidth, scrollLeft: 0, children: [{}, {}],
  })
  harness.refs[0].current = element
  const removeListener = vi.spyOn(element, 'removeEventListener')
  const cleanup = harness.effects[0]()
  cleanups.push(cleanup)
  return { element, resize: () => resize(), observe, disconnect, removeListener, cleanup }
}

it('shows only the direction that still has hidden filters', () => {
  const { element } = mount()
  expect(harness.edges).toEqual({ left: false, right: true })
  element.scrollLeft = 150
  element.dispatchEvent(new Event('scroll'))
  expect(harness.edges).toEqual({ left: true, right: true })
  element.scrollLeft = 299.5
  element.dispatchEvent(new Event('scroll'))
  expect(harness.edges).toEqual({ left: true, right: false })
})

it('hides hints when content fits, including browser overscroll', () => {
  const { element } = mount(400, 400)
  expect(harness.edges).toEqual({ left: false, right: false })
  element.scrollLeft = -20
  element.dispatchEvent(new Event('scroll'))
  expect(harness.edges).toEqual({ left: false, right: false })
})

it('updates after opening a hidden drawer, resizing, or changing content width', () => {
  const { element, resize, observe } = mount(0)
  expect(harness.edges).toEqual({ left: false, right: false })
  expect(observe).toHaveBeenCalledTimes(3)
  element.clientWidth = 100
  resize()
  expect(harness.edges).toEqual({ left: false, right: true })
  element.clientWidth = 500
  resize()
  expect(harness.edges).toEqual({ left: false, right: false })
  element.scrollWidth = 800
  resize()
  expect(harness.edges).toEqual({ left: false, right: true })
})

it('removes the scroll listener and resize observer when unmounted', () => {
  const { element, cleanup, disconnect, removeListener } = mount()
  cleanup()
  cleanups.length = 0
  expect(disconnect).toHaveBeenCalledOnce()
  expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  element.scrollLeft = 300
  element.dispatchEvent(new Event('scroll'))
  expect(harness.edges).toEqual({ left: false, right: true })
})
