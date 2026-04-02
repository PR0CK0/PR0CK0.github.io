import { useEffect, useRef, useState, useCallback } from 'react'
import cytoscape from 'cytoscape'
// @ts-ignore
import coseBilkent from 'cytoscape-cose-bilkent'
import type { Person } from '../types'

cytoscape.use(coseBilkent)

interface Props { person: Person }

type NodeType = 'Person' | 'Education' | 'WorkExperience' | 'Publication' | 'Project' | 'Skill' | 'Award' | 'Certificate' | 'Talk'

const NODE_COLORS: Record<NodeType | string, string> = {
  Person:         '#00ff88',
  Education:      '#b57bff',
  WorkExperience: '#4d9fff',
  Publication:    '#4d9fff',
  Project:        '#ffb300',
  Skill:          '#4a5a7a',
  Award:          '#ffb300',
  Certificate:    '#b57bff',
  Talk:           '#4d9fff',
}

const ALL_TYPES: NodeType[] = ['Person','Education','WorkExperience','Publication','Project','Skill','Award','Certificate','Talk']

function buildElements(person: Person, filter: NodeType[]) {
  const nodes: cytoscape.ElementDefinition[] = []
  const edges: cytoscape.ElementDefinition[] = []

  const add = (id: string, label: string, type: NodeType, sub?: string) => {
    if (!filter.includes(type)) return
    nodes.push({ data: { id, label, type, sub } })
    if (type !== 'Person') {
      edges.push({ data: { source: 'person-root', target: id } })
    }
  }

  if (filter.includes('Person')) {
    nodes.push({ data: { id: 'person-root', label: person.name, type: 'Person' } })
  }

  person.education?.forEach((e) =>
    add(e.id, `${e.degree}\n${e.institution}`, 'Education', e.field))

  person.work_experiences?.slice(0, 8).forEach((w) =>
    add(w.id, `${w.title}\n${w.organization}`, 'WorkExperience'))

  person.publications?.filter(p => p.status === 'published').slice(0, 10).forEach((p) =>
    add(p.id, p.title.slice(0, 40) + (p.title.length > 40 ? '…' : ''), 'Publication'))

  person.projects?.slice(0, 8).forEach((p) =>
    add(p.id, p.title, 'Project'))

  person.skills?.filter(s => s.proficiency === 'expert' || s.proficiency === 'advanced').slice(0, 20).forEach((s) =>
    add(s.id, s.name, 'Skill'))

  person.awards?.forEach((a) =>
    add(a.id, a.title, 'Award'))

  person.certificates?.filter(c => c.status === 'completed').forEach((c) =>
    add(c.id, c.title, 'Certificate'))

  person.talks?.forEach((t) =>
    add(t.id, t.title, 'Talk'))

  return [...nodes, ...edges]
}

export default function KnowledgeGraph({ person }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef        = useRef<cytoscape.Core | null>(null)
  const [selected, setSelected] = useState<{ label: string; type: string; sub?: string } | null>(null)
  const [filter, setFilter]     = useState<NodeType[]>([...ALL_TYPES])
  const [building, setBuilding] = useState(true)

  const initCy = useCallback(() => {
    if (!containerRef.current) return
    cyRef.current?.destroy()

    setBuilding(true)
    const elements = buildElements(person, filter)

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: cytoscape.NodeSingular) =>
              NODE_COLORS[ele.data('type') as string] ?? '#4a5a7a',
            'label': 'data(label)',
            'color': '#c8d6f0',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '9px',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'width': (ele: cytoscape.NodeSingular) => ele.data('type') === 'Person' ? 36 : 18,
            'height': (ele: cytoscape.NodeSingular) => ele.data('type') === 'Person' ? 36 : 18,
            'border-width': 1,
            'border-color': '#1e2d4a',
          } as any,
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#1e2d4a',
            'opacity': 0.6,
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 2,
            'border-color': '#00ff88',
          },
        },
      ],
      layout: {
        name: 'cose-bilkent',
        animate: false,
        randomize: true,
        nodeRepulsion: 4500,
        idealEdgeLength: 100,
        edgeElasticity: 0.45,
      } as any,
    })

    cy.on('tap', 'node', (evt) => {
      const d = evt.target.data()
      setSelected({ label: d.label, type: d.type, sub: d.sub })
    })
    cy.on('tap', (evt) => {
      if (evt.target === cy) setSelected(null)
    })

    cyRef.current = cy
    setBuilding(false)
  }, [person, filter])

  useEffect(() => { initCy() }, [initCy])

  const fitScreen  = () => cyRef.current?.fit(undefined, 30)
  const resetLayout = () => initCy()

  const toggleType = (type: NodeType) => {
    setFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-4">
        <p className="text-xs font-mono text-terminal-green text-glow-green mb-1">$ ~/graph →</p>
        <h2 className="text-2xl font-bold font-mono text-terminal-text">Knowledge Graph</h2>
        <p className="text-xs font-mono text-terminal-muted mt-1">scroll · pan · zoom · click · drag</p>
      </div>

      {/* filter chips */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-xs font-mono text-terminal-muted">Filter by type:</span>
        {ALL_TYPES.map(t => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            style={{ borderColor: NODE_COLORS[t], color: filter.includes(t) ? NODE_COLORS[t] : '#4a5a7a' }}
            className="text-xs font-mono px-2 py-0.5 rounded border transition-all"
          >
            {t}
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="flex gap-2 mb-3">
        <button onClick={fitScreen}
          className="text-xs font-mono px-3 py-1 rounded border border-terminal-border text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50 transition-all">
          ⊡ Fit to Screen
        </button>
        <button onClick={resetLayout}
          className="text-xs font-mono px-3 py-1 rounded border border-terminal-border text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/50 transition-all">
          ↺ Reset Layout
        </button>
      </div>

      <div className="relative border border-terminal-border rounded overflow-hidden" style={{ height: 520 }}>
        {building && (
          <div className="absolute inset-0 flex items-center justify-center bg-terminal-bg/80 z-10">
            <p className="text-xs font-mono text-terminal-green">building knowledge graph...</p>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full bg-terminal-bg" />
      </div>

      {selected && (
        <div className="mt-4 border border-terminal-border rounded p-4 font-mono text-sm">
          <p className="text-terminal-muted text-xs mb-1">Selected Node</p>
          <p className="text-terminal-text font-bold">{selected.label}</p>
          <p style={{ color: NODE_COLORS[selected.type] }} className="text-xs mt-1">{selected.type}</p>
          {selected.sub && <p className="text-xs text-terminal-muted mt-1">{selected.sub}</p>}
        </div>
      )}
    </section>
  )
}
