import { expect, it } from 'vitest'
import { pointInsidePolygonPoints } from '../node_modules/cytoscape/src/math.mjs'

it.each([0.5, 1, 2])('recognizes the diamond center and vertical axis at scale %s', scale => {
  const points = [0, -30, 30, 0, 0, 30, -30, 0].map(value => value * scale)
  for (const y of [-20, 0, 20]) expect(pointInsidePolygonPoints(0, y * scale, points)).toBe(true)
  for (const x of [-1, 1]) expect(pointInsidePolygonPoints(x * scale, 0, points)).toBe(true)
  expect(pointInsidePolygonPoints(25 * scale, 25 * scale, points)).toBe(false)
  expect(pointInsidePolygonPoints(0, 40 * scale, points)).toBe(false)
})

it('handles both vertex orders and translated diamonds', () => {
  const vertices = [[0, -30], [30, 0], [0, 30], [-30, 0]]
  for (const order of [vertices, [...vertices].reverse()]) {
    const points = order.flatMap(([x, y]) => [x + 120, y - 70])
    expect(pointInsidePolygonPoints(120, -70, points)).toBe(true)
    expect(pointInsidePolygonPoints(145, -45, points)).toBe(false)
  }
})

it('preserves inside/outside detection for other polygon shapes', () => {
  const triangle = [0, -30, 30, 30, -30, 30]
  const rectangle = [-30, -30, 30, -30, 30, 30, -30, 30]
  for (const points of [triangle, rectangle]) {
    expect(pointInsidePolygonPoints(0, 0, points)).toBe(true)
    expect(pointInsidePolygonPoints(40, 0, points)).toBe(false)
  }
})
