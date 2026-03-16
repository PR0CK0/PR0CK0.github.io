import { useState, useEffect, useRef, useCallback } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import cytoscape from 'cytoscape'
// @ts-ignore — no bundled types for default import
import coseBilkent from 'cytoscape-cose-bilkent'
import { loadPortfolioData } from '@/lib/yaml-loader'
import { buildGraph, type CyNode, type CyEdge } from '@/lib/graph-builder'

cytoscape.use(coseBilkent)

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType =
  | 'person'
  | 'education'
  | 'work'
  | 'publication'
  | 'project'
  | 'skill'
  | 'award'
  | 'talk'
  | 'certificate'

interface SelectedNode {
  id: string
  label: string
  type: NodeType
  subtitle?: string
  year?: string
  detail?: string
  category?: string
  connectedLabels: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_TYPES: NodeType[] = [
  'person',
  'education',
  'work',
  'publication',
  'project',
  'skill',
  'award',
  'talk',
  'certificate',
]

const TYPE_META: Record<
  NodeType,
  { color: string; label: string; shape: string; size: number }
> = {
  person:      { color: '#00ff88', label: 'Person',       shape: 'diamond',   size: 60 },
  education:   { color: '#4d9fff', label: 'Education',    shape: 'ellipse',   size: 45 },
  work:        { color: '#ffb300', label: 'Work',         shape: 'rectangle', size: 45 },
  publication: { color: '#b57bff', label: 'Publication',  shape: 'ellipse',   size: 35 },
  project:     { color: '#ff4d6d', label: 'Project',      shape: 'triangle',  size: 35 },
  skill:       { color: '#00d4ff', label: 'Skill',        shape: 'ellipse',   size: 28 },
  award:       { color: '#ffd700', label: 'Award',        shape: 'star',      size: 35 },
  talk:        { color: '#ff8800', label: 'Talk',         shape: 'ellipse',   size: 30 },
  certificate: { color: '#aaaaaa', label: 'Certificate',  shape: 'ellipse',   size: 28 },
}

const LAYOUT_OPTIONS = {
  name: 'cose-bilkent',
  animate: 'end',
  animationEasing: 'ease-out',
  animationDuration: 1000,
  randomize: true,
  nodeDimensionsIncludeLabels: true,
  idealEdgeLength: 100,
  nodeRepulsion: 8000,
  numIter: 2500,
}

// ─── Cytoscape stylesheet ──────────────────────────────────────────────────────

function buildStylesheet(): object[] {
  const nodeStyles = NODE_TYPES.map((type) => {
    const meta = TYPE_META[type]
    return {
      selector: `node[type = "${type}"]`,
      style: {
        'background-color': meta.color,
        'width': meta.size,
        'height': meta.size,
        'shape': meta.shape,
        'border-width': type === 'person' ? 3 : 1.5,
        'border-color': meta.color,
        'border-opacity': 0.8,
      },
    }
  })

  return [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'color': '#c8d6f0',
        'font-size': '9px',
        'font-family': 'JetBrains Mono, Fira Code, Consolas, monospace',
        'text-margin-y': 4,
        'text-wrap': 'ellipsis',
        'text-max-width': '80px',
        'text-background-color': '#0a0e1a',
        'text-background-opacity': 0.7,
        'text-background-padding': '2px',
        'overlay-opacity': 0,
        'transition-property': 'opacity, border-width, border-color',
        'transition-duration': 200,
      },
    },
    ...nodeStyles,
    {
      selector: 'node[type = "person"]',
      style: {
        'shadow-blur': 20,
        'shadow-color': '#00ff88',
        'shadow-opacity': 0.6,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
        'font-size': '11px',
        'color': '#00ff88',
        'font-weight': 'bold',
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': 'rgba(200, 214, 240, 0.3)',
        'target-arrow-color': 'rgba(200, 214, 240, 0.3)',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.6,
        'curve-style': 'bezier',
        'overlay-opacity': 0,
        'transition-property': 'opacity, line-color',
        'transition-duration': 200,
      },
    },
    {
      selector: 'edge[type = "skill-usage"]',
      style: {
        'line-color': 'rgba(200, 214, 240, 0.1)',
        'target-arrow-color': 'rgba(200, 214, 240, 0.1)',
        'width': 1,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 3,
        'border-color': '#ffffff',
        'shadow-blur': 16,
        'shadow-color': '#ffffff',
        'shadow-opacity': 0.9,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
      },
    },
    {
      selector: 'node.faded',
      style: { 'opacity': 0.1 },
    },
    {
      selector: 'edge.faded',
      style: { 'opacity': 0.05 },
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 2.5,
        'border-color': '#ffffff',
        'opacity': 1,
      },
    },
    {
      selector: 'node.neighbour',
      style: {
        'opacity': 1,
        'border-width': 2,
        'border-color': 'rgba(200, 214, 240, 0.6)',
      },
    },
    {
      selector: 'edge.neighbour',
      style: {
        'opacity': 1,
        'line-color': 'rgba(200, 214, 240, 0.6)',
        'target-arrow-color': 'rgba(200, 214, 240, 0.6)',
      },
    },
  ]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: NodeType }) {
  const meta = TYPE_META[type]
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider"
      style={{ backgroundColor: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}
    >
      {meta.label}
    </span>
  )
}

function LoadingSpinner() {
  const [frame, setFrame] = useState(0)
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), 80)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-4xl" style={{ color: '#00ff88' }}>
        {frames[frame]}
      </div>
      <div className="font-mono text-sm" style={{ color: '#4a5a7a' }}>
        building knowledge graph...
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Graph() {
  const cyRef = useRef<cytoscape.Core | null>(null)

  const [elements, setElements] = useState<(CyNode | CyEdge)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [enabledTypes, setEnabledTypes] = useState<Set<NodeType>>(
    new Set(NODE_TYPES)
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)

  // Track stats
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })

  // ── Load data ────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadPortfolioData()
      .then((person) => {
        const { nodes, edges } = buildGraph(person)
        setElements([...nodes, ...edges])
        setStats({ nodes: nodes.length, edges: edges.length })
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message ?? 'Failed to load graph data')
        setLoading(false)
      })
  }, [])

  // ── Type filter ──────────────────────────────────────────────────────────────

  const toggleType = useCallback(
    (type: NodeType) => {
      setEnabledTypes((prev) => {
        const next = new Set(prev)
        if (next.has(type)) {
          next.delete(type)
        } else {
          next.add(type)
        }
        return next
      })
    },
    []
  )

  // Apply type visibility to Cytoscape whenever enabledTypes changes
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    NODE_TYPES.forEach((type) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodes = cy.nodes(`[type = "${type}"]`) as any
      if (enabledTypes.has(type)) {
        nodes.show()
        nodes.connectedEdges().show()
      } else {
        nodes.hide()
        nodes.connectedEdges().hide()
      }
    })
  }, [enabledTypes])

  // ── Search ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    const q = searchQuery.trim().toLowerCase()

    // Clear all search classes
    cy.elements().removeClass('faded highlighted')

    if (!q) return

    const matching = cy.nodes().filter((node) =>
      node.data('label')?.toLowerCase().includes(q)
    )
    const nonMatching = cy.nodes().not(matching)

    nonMatching.addClass('faded')
    cy.edges().addClass('faded')
    matching.addClass('highlighted')

    // Show connected edges of matching nodes without faded
    matching.connectedEdges().removeClass('faded')
  }, [searchQuery])

  // ── Node click ───────────────────────────────────────────────────────────────

  const handleCyReady = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy

    // Re-apply type visibility after cy is ready
    NODE_TYPES.forEach((type) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodes = cy.nodes(`[type = "${type}"]`) as any
      nodes.show()
    })

    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const data = node.data()

      // Gather connected node labels
      const connectedLabels: string[] = node
        .neighborhood('node')
        .map((n: cytoscape.NodeSingular) => n.data('label') as string)
        .filter(Boolean)

      setSelectedNode({
        id: data.id,
        label: data.label,
        type: data.type as NodeType,
        subtitle: data.subtitle,
        year: data.year,
        detail: data.detail,
        category: data.category,
        connectedLabels,
      })

      // Dim everything, highlight neighbourhood
      cy.elements().removeClass('neighbour faded')
      cy.elements().not(node).not(node.neighborhood()).addClass('faded')
      node.neighborhood().addClass('neighbour')
      node.removeClass('faded')
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        // Clicked on background — deselect
        setSelectedNode(null)
        cy.elements().removeClass('faded neighbour highlighted')
      }
    })

    cy.on('mouseover', 'node', (evt) => {
      const container = cy.container()
      if (container) container.style.cursor = 'pointer'
    })

    cy.on('mouseout', 'node', () => {
      const container = cy.container()
      if (container) container.style.cursor = 'default'
    })
  }, [])

  // ── Layout controls ──────────────────────────────────────────────────────────

  const runLayout = useCallback(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.layout(LAYOUT_OPTIONS as cytoscape.LayoutOptions).run()
  }, [])

  const fitToScreen = useCallback(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.fit(undefined, 40)
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex overflow-hidden font-mono"
      style={{ height: 'calc(100vh - 48px)', background: '#0a0e1a' }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col overflow-y-auto flex-shrink-0"
        style={{
          width: 280,
          background: '#0f1629',
          borderRight: '1px solid #1e2d4a',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #1e2d4a' }}
        >
          <div className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: '#00ff88' }}>
            Knowledge Graph
          </div>
          <div className="text-xs" style={{ color: '#4a5a7a' }}>
            {stats.nodes} nodes &middot; {stats.edges} edges
          </div>
        </div>

        {/* Filter by type */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4a5a7a' }}>
            Filter by type
          </div>
          <div className="flex flex-col gap-1.5">
            {NODE_TYPES.map((type) => {
              const meta = TYPE_META[type]
              const enabled = enabledTypes.has(type)
              return (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer select-none group"
                  style={{ opacity: enabled ? 1 : 0.45 }}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleType(type)}
                    className="sr-only"
                  />
                  {/* Custom checkbox */}
                  <span
                    className="w-3.5 h-3.5 flex-shrink-0 rounded-sm border flex items-center justify-center transition-all"
                    style={{
                      borderColor: enabled ? meta.color : '#1e2d4a',
                      backgroundColor: enabled ? meta.color + '33' : 'transparent',
                    }}
                  >
                    {enabled && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4L3 6L7 2" stroke={meta.color} strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  {/* Color dot */}
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-xs" style={{ color: '#c8d6f0' }}>
                    {meta.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4a5a7a' }}>
            Search
          </div>
          <div className="relative">
            <span
              className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: '#4a5a7a' }}
            >
              /
            </span>
            <input
              type="text"
              placeholder="filter nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-5 pr-3 py-1.5 text-xs rounded outline-none transition-all"
              style={{
                background: '#0a0e1a',
                border: '1px solid #1e2d4a',
                color: '#c8d6f0',
                caretColor: '#00ff88',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00ff8855'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#1e2d4a'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs transition-opacity hover:opacity-100"
                style={{ color: '#4a5a7a' }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 flex flex-col gap-2 flex-shrink-0" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <button
            onClick={runLayout}
            className="w-full py-1.5 px-3 text-xs rounded transition-all text-left"
            style={{
              background: '#1e2d4a',
              color: '#c8d6f0',
              border: '1px solid #2a3d5a',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#243452'
              e.currentTarget.style.color = '#00ff88'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e2d4a'
              e.currentTarget.style.color = '#c8d6f0'
            }}
          >
            ↺ Reset Layout
          </button>
          <button
            onClick={fitToScreen}
            className="w-full py-1.5 px-3 text-xs rounded transition-all text-left"
            style={{
              background: '#1e2d4a',
              color: '#c8d6f0',
              border: '1px solid #2a3d5a',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#243452'
              e.currentTarget.style.color = '#4d9fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e2d4a'
              e.currentTarget.style.color = '#c8d6f0'
            }}
          >
            ⊡ Fit to Screen
          </button>
        </div>

        {/* Selected node panel */}
        <div className="px-4 py-3 flex-1 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4a5a7a' }}>
            Selected Node
          </div>

          {!selectedNode ? (
            <div
              className="rounded p-3 text-xs"
              style={{
                background: '#0a0e1a',
                border: '1px solid #1e2d4a',
                color: '#4a5a7a',
              }}
            >
              <span className="animate-blink">▮</span> click a node to inspect
            </div>
          ) : (
            <div
              className="rounded p-3 flex flex-col gap-2"
              style={{
                background: '#0a0e1a',
                border: `1px solid ${TYPE_META[selectedNode.type].color}33`,
              }}
            >
              <TypeBadge type={selectedNode.type} />

              <div>
                <div className="text-xs font-bold leading-snug" style={{ color: '#c8d6f0' }}>
                  {selectedNode.label}
                </div>
                {selectedNode.subtitle && (
                  <div className="text-xs mt-0.5" style={{ color: '#4a5a7a' }}>
                    {selectedNode.subtitle}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedNode.year && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#1e2d4a', color: '#c8d6f0' }}
                  >
                    {selectedNode.year}
                  </span>
                )}
                {selectedNode.detail && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#1e2d4a', color: '#ffb300' }}
                  >
                    {selectedNode.detail}
                  </span>
                )}
                {selectedNode.category && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#1e2d4a', color: '#4d9fff' }}
                  >
                    {selectedNode.category}
                  </span>
                )}
              </div>

              {selectedNode.connectedLabels.length > 0 && (
                <div>
                  <div
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: '#4a5a7a' }}
                  >
                    Connected ({selectedNode.connectedLabels.length})
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                    {selectedNode.connectedLabels.map((lbl, i) => (
                      <div
                        key={i}
                        className="text-xs py-0.5 px-2 rounded"
                        style={{
                          background: '#1e2d4a',
                          color: '#c8d6f0',
                          borderLeft: `2px solid ${TYPE_META[selectedNode.type].color}55`,
                        }}
                      >
                        {lbl}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="px-4 py-2 flex-shrink-0 text-xs"
          style={{ borderTop: '1px solid #1e2d4a', color: '#2a3d5a' }}
        >
          scroll · pan · zoom · click · drag
        </div>
      </aside>

      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#0a0e1a' }}>
        {loading && <LoadingSpinner />}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="font-mono text-sm" style={{ color: '#ff4d6d' }}>
              ✗ {error}
            </div>
          </div>
        )}

        {!loading && !error && elements.length > 0 && (
          <CytoscapeComponent
            elements={elements}
            stylesheet={buildStylesheet() as never}
            layout={LAYOUT_OPTIONS as cytoscape.LayoutOptions}
            style={{ width: '100%', height: '100%' }}
            cy={handleCyReady}
            minZoom={0.05}
            maxZoom={4}
            wheelSensitivity={0.3}
          />
        )}

        {/* Overlay: node count badge when search is active */}
        {searchQuery && (
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-mono pointer-events-none"
            style={{
              background: '#0f162999',
              border: '1px solid #1e2d4a',
              color: '#00ff88',
              backdropFilter: 'blur(4px)',
            }}
          >
            / {searchQuery}
          </div>
        )}

        {/* Graph legend overlay */}
        <div
          className="absolute bottom-3 right-3 px-3 py-2 rounded text-xs font-mono pointer-events-none"
          style={{
            background: '#0f162988',
            border: '1px solid #1e2d4a',
            color: '#4a5a7a',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="flex flex-wrap gap-x-3 gap-y-1 max-w-xs justify-end">
            {NODE_TYPES.filter((t) => enabledTypes.has(t)).map((type) => (
              <span key={type} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: TYPE_META[type].color }}
                />
                <span style={{ color: '#4a5a7a' }}>{TYPE_META[type].label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
