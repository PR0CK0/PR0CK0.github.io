import { describe, it, expect } from 'vitest'
import { buildGraph } from '../graph-builder'
import type { Person } from '../schema'

describe('buildGraph', () => {
  it('omits cv_exclude projects and skills only they use', () => {
    const person = {
      id: 'person/x',
      name: 'X',
      projects: [
        { id: 'proj/shown', title: 'Shown', year: '2024', description: '', technologies: ['Python'] },
        { id: 'proj/hidden', title: 'Hidden', year: '2024', description: '', technologies: ['Rust'], cv_exclude: true },
      ],
    } as Person
    const ids = buildGraph(person).nodes.map((n) => n.data.id)
    expect(ids).toContain('proj/shown')
    expect(ids).not.toContain('proj/hidden')
    expect(ids.some((id) => id.toLowerCase().includes('rust'))).toBe(false)
  })
})
