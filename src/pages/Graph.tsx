import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  | 'course'

interface SelectedNode {
  id: string
  label: string
  type: NodeType
  subtitle?: string
  year?: string
  detail?: string
  category?: string
  connectedNodes: Array<{ id: string; label: string; type: NodeType }>
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
  'course',
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
  course:      { color: '#34d399', label: 'Course',       shape: 'roundrectangle', size: 32 },
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

function LoadingSpinner({ phase }: { phase: 'loading' | 'layout' }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10" style={{ background: '#0a0e1a' }}>
      {/* CSS-only spinner — runs on compositor thread, unaffected by JS blocking */}
      <div
        className="rounded-full"
        style={{
          width: 28,
          height: 28,
          border: '2px solid #1e2d4a',
          borderTopColor: '#00ff88',
          animation: 'graph-spin 0.9s linear infinite',
        }}
      />
      <div className="font-mono text-xs flex items-center gap-0" style={{ color: '#4a5a7a' }}>
        <span style={{ color: '#00ff88', marginRight: 6 }}>$</span>
        {phase === 'loading' ? 'load_knowledge_graph' : 'render_graph'}
        <span style={{ animation: 'graph-blink 1s step-end infinite', color: '#00ff88', marginLeft: 1 }}>▮</span>
      </div>
      <style>{`
        @keyframes graph-spin  { to { transform: rotate(360deg); } }
        @keyframes graph-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Graph() {
  const cyRef = useRef<cytoscape.Core | null>(null)
  const [searchParams] = useSearchParams()

  const [elements, setElements] = useState<(CyNode | CyEdge)[]>([])
  const [phase, setPhase] = useState<'loading' | 'layout' | 'ready'>('loading')
  const [error, setError] = useState<string | null>(null)

  const [enabledTypes, setEnabledTypes] = useState<Set<NodeType>>(
    new Set(NODE_TYPES)
  )
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [cyReady, setCyReady] = useState(false)
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Track stats
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })

  // ── Load data ────────────────────────────────────────────────────────────────

  useEffect(() => {
    // 250ms: ensures the navbar CSS transition (duration-200) fully completes
    // before buildGraph/cose-bilkent blocks the main thread.
    const timer = setTimeout(() => {
      loadPortfolioData()
        .then((person) => {
          const { nodes, edges } = buildGraph(person)
          setElements([...nodes, ...edges])
          setStats({ nodes: nodes.length, edges: edges.length })
          setPhase('layout') // spinner stays up; Cytoscape mounts invisibly
        })
        .catch((err) => {
          setError(err.message ?? 'Failed to load graph data')
          setPhase('ready')
        })
    }, 250)
    return () => clearTimeout(timer)
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

  // Apply type visibility whenever enabledTypes changes
  // TODO: orphan pen — when filtering leaves nodes with no visible edges, move them into
  // a fenced "// filtered nodes" area below the main graph with a dashed HTML overlay that
  // tracks pan/zoom. Tricky state: hide/show cycles across multiple filter toggles need
  // savedPositions + penNodeIds refs to survive, and edge visibility must use the
  // "both endpoints visible" rule (not the old connectedEdges().show/hide approach).
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
  }, [searchQuery, cyReady])


  // ── Node click ───────────────────────────────────────────────────────────────

  const handleCyReady = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy
    setCyReady(true)

    // Reveal graph after first layout completes
    cy.one('layoutstop', () => setPhase('ready'))

    // Re-apply type visibility after cy is ready
    NODE_TYPES.forEach((type) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodes = cy.nodes(`[type = "${type}"]`) as any
      nodes.show()
    })


    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const data = node.data()

      // Gather connected nodes with type
      const connectedNodes = node
        .neighborhood('node')
        .map((n: cytoscape.NodeSingular) => ({ id: n.data('id') as string, label: n.data('label') as string, type: n.data('type') as NodeType }))
        .filter((n: { id: string; label: string; type: NodeType }) => Boolean(n.label))

      setSelectedNode({
        id: data.id,
        label: data.label,
        type: data.type as NodeType,
        subtitle: data.subtitle,
        year: data.year,
        detail: data.detail,
        category: data.category,
        connectedNodes,
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

  // ── Programmatic node selection ──────────────────────────────────────────────

  const selectNodeById = useCallback((id: string) => {
    const cy = cyRef.current
    if (!cy) return
    const node = cy.getElementById(id)
    if (!node.length) return

    const data = node.data()
    const connectedNodes = node
      .neighborhood('node')
      .map((n: cytoscape.NodeSingular) => ({ id: n.data('id') as string, label: n.data('label') as string, type: n.data('type') as NodeType }))
      .filter((n: { id: string; label: string; type: NodeType }) => Boolean(n.label))

    setSelectedNode({
      id: data.id,
      label: data.label,
      type: data.type as NodeType,
      subtitle: data.subtitle,
      year: data.year,
      detail: data.detail,
      category: data.category,
      connectedNodes,
    })

    cy.elements().removeClass('neighbour faded')
    cy.elements().not(node).not(node.neighborhood()).addClass('faded')
    node.neighborhood().addClass('neighbour')
    node.removeClass('faded')
    cy.animate({ center: { eles: node }, duration: 300 } as cytoscape.AnimationOptions)
  }, [])

  // ── Auto-select node from ?q= param after layout is ready ───────────────────

  useEffect(() => {
    if (phase !== 'ready') return
    const cy = cyRef.current
    if (!cy) return
    const q = searchParams.get('q')
    if (!q) return

    // Find the node whose label matches the query (case-insensitive)
    const match = cy.nodes().filter((n) =>
      n.data('label')?.toLowerCase() === q.toLowerCase()
    ).first()

    if (!match.length) return

    // Select the node and clear the search box
    setSearchQuery('')
    selectNodeById(match.data('id') as string)
  }, [phase])

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

  // Sidebar content shared between desktop and mobile drawer
  const sidebarContent = (
    <>
      {/* Filter by type */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e2d4a' }}>
        <div className="text-[0.6rem] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: '#4a5a7a' }}>
          Filter by type
        </div>
        {/* On mobile: wrap in a horizontal scroll row; on desktop: vertical list */}
        <div className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-x-visible pb-1 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
          {NODE_TYPES.map((type) => {
            const meta = TYPE_META[type]
            const enabled = enabledTypes.has(type)
            return (
              <label
                key={type}
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none flex-shrink-0"
                style={{ opacity: enabled ? 1 : 0.45 }}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleType(type)}
                  className="sr-only"
                />
                <span
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 rounded-sm border flex items-center justify-center transition-all"
                  style={{
                    borderColor: enabled ? meta.color : '#1e2d4a',
                    backgroundColor: enabled ? meta.color + '33' : 'transparent',
                  }}
                >
                  {enabled && (
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4L3 6L7 2" stroke={meta.color} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-[0.6rem] sm:text-xs whitespace-nowrap" style={{ color: '#c8d6f0' }}>
                  {meta.label}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e2d4a' }}>
        <div className="text-[0.6rem] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: '#4a5a7a' }}>
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
            className="w-full pl-5 pr-3 py-1 sm:py-1.5 text-[0.65rem] sm:text-xs rounded outline-none transition-all"
            style={{
              background: '#0a0e1a',
              border: '1px solid #1e2d4a',
              color: '#c8d6f0',
              caretColor: '#00ff88',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#00ff8855' }}
            onBlur={(e) => { e.target.style.borderColor = '#1e2d4a' }}
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
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex gap-2 flex-shrink-0" style={{ borderBottom: '1px solid #1e2d4a' }}>
        <button
          onClick={runLayout}
          className="flex-1 py-1 sm:py-1.5 px-2 sm:px-3 text-[0.65rem] sm:text-xs rounded transition-all text-left"
          style={{ background: '#1e2d4a', color: '#c8d6f0', border: '1px solid #2a3d5a' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#243452'; e.currentTarget.style.color = '#00ff88' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1e2d4a'; e.currentTarget.style.color = '#c8d6f0' }}
        >
          ↺ Reset Layout
        </button>
        <button
          onClick={fitToScreen}
          className="flex-1 py-1 sm:py-1.5 px-2 sm:px-3 text-[0.65rem] sm:text-xs rounded transition-all text-left"
          style={{ background: '#1e2d4a', color: '#c8d6f0', border: '1px solid #2a3d5a' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#243452'; e.currentTarget.style.color = '#4d9fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1e2d4a'; e.currentTarget.style.color = '#c8d6f0' }}
        >
          ⊡ Fit to Screen
        </button>
      </div>

      {/* Selected node panel */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex-1 overflow-y-auto">
        <div className="text-[0.6rem] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: '#4a5a7a' }}>
          Selected Node
        </div>

        {!selectedNode ? (
          <div
            className="rounded p-2 sm:p-3 text-[0.65rem] sm:text-xs"
            style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#4a5a7a' }}
          >
            <span className="animate-blink">▮</span> click a node to inspect
          </div>
        ) : (
          <div
            className="rounded p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2"
            style={{ background: '#0a0e1a', border: `1px solid ${TYPE_META[selectedNode.type].color}33` }}
          >
            <TypeBadge type={selectedNode.type} />

            <div>
              <div className="text-[0.65rem] sm:text-xs font-bold leading-snug" style={{ color: '#c8d6f0' }}>
                {selectedNode.label}
              </div>
              {selectedNode.subtitle && (
                <div className="text-[0.6rem] sm:text-xs mt-0.5" style={{ color: '#4a5a7a' }}>
                  {selectedNode.subtitle}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {selectedNode.year && (
                <span className="text-[0.6rem] sm:text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: '#c8d6f0' }}>
                  {selectedNode.year}
                </span>
              )}
              {selectedNode.detail && (
                <span className="text-[0.6rem] sm:text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: '#ffb300' }}>
                  {selectedNode.detail}
                </span>
              )}
              {selectedNode.category && (
                <span className="text-[0.6rem] sm:text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: '#4d9fff' }}>
                  {selectedNode.category}
                </span>
              )}
            </div>

            {selectedNode.connectedNodes.length > 0 && (
              <div>
                <div className="text-[0.6rem] sm:text-xs uppercase tracking-wider mb-1" style={{ color: '#4a5a7a' }}>
                  Connected ({selectedNode.connectedNodes.length})
                </div>
                <div className="flex flex-col gap-0.5 max-h-36 sm:max-h-48 overflow-y-auto">
                  {selectedNode.connectedNodes.map((n, i) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.skill
                    return (
                      <button
                        key={i}
                        onClick={() => selectNodeById(n.id)}
                        className="text-[0.6rem] sm:text-xs py-0.5 px-2 rounded flex items-baseline gap-1.5 w-full text-left transition-opacity hover:opacity-80"
                        style={{ background: '#1e2d4a', borderLeft: `2px solid ${meta.color}66`, cursor: 'pointer' }}
                      >
                        <span className="font-bold uppercase tracking-wider flex-shrink-0" style={{ color: meta.color, fontSize: '0.55rem' }}>
                          {meta.label}
                        </span>
                        <span className="truncate" style={{ color: '#c8d6f0' }}>{n.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint — desktop only */}
      <div
        className="hidden sm:block px-4 py-2 flex-shrink-0 text-xs text-center"
        style={{ borderTop: '1px solid #1e2d4a', color: '#2a3d5a' }}
      >
        scroll · pan · zoom · click · drag
      </div>
    </>
  )

  return (
    <div
      className="flex flex-col-reverse sm:flex-row overflow-hidden font-mono h-[calc(100dvh-65px)] sm:h-[calc(100dvh-79px)]"
      style={{ background: '#0a0e1a' }}
    >
      {/* ── Sidebar — desktop: left panel (collapsible); mobile: bottom drawer ── */}
      <aside
        className="flex flex-col flex-shrink-0"
        style={{
          background: '#0f1629',
          borderRight: sidebarOpen ? '1px solid #1e2d4a' : 'none',
          width: sidebarOpen ? 280 : 21,
          minWidth: sidebarOpen ? 280 : 21,
          maxWidth: sidebarOpen ? 280 : 21,
        }}
      >
        {/* ── Mobile toggle strip (hidden on desktop) ── */}
        <button
          className="sm:hidden flex items-center justify-between px-3 flex-shrink-0 w-full text-left"
          style={{
            borderTop: '1px solid #1e2d4a',
            borderBottom: mobileOpen ? '1px solid #1e2d4a' : 'none',
            background: '#0f1629',
            minHeight: 36,
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          }}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span className="flex items-center gap-2">
            <span className="text-[0.6rem] font-bold tracking-widest uppercase" style={{ color: '#00ff88' }}>
              graph controls
            </span>
            <span className="text-[0.55rem]" style={{ color: '#4a5a7a' }}>
              {stats.nodes}n · {stats.edges}e
            </span>
          </span>
          <span className="text-xs" style={{ color: '#4a5a7a' }}>
            {mobileOpen ? '▾' : '▴'}
          </span>
        </button>

        {/* ── Desktop header with collapse toggle (hidden on mobile) ── */}
        <div
          className="hidden sm:block relative flex-shrink-0"
          style={{ borderBottom: '1px solid #1e2d4a', minWidth: sidebarOpen ? 280 : 21 }}
        >
          {/* Title text — pr-7 keeps text clear of the absolute button */}
          {sidebarOpen && (
            <div className="px-4 pr-7 py-3 cursor-pointer select-none" onClick={() => setSidebarOpen((o) => !o)}>
              <div className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: '#00ff88' }}>
                Tyler Procko's Knowledge Graph
              </div>
              <div className="text-xs" style={{ color: '#4a5a7a' }}>
                {stats.nodes} nodes &middot; {stats.edges} edges
              </div>
            </div>
          )}

          {/* Collapse button — flush with the right edge */}
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-l text-xs font-bold transition-colors cursor-pointer"
            style={{
              background: '#1e2d4a',
              border: '1px solid #2a3d5a',
              color: '#00ff88',
            }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>

          {/* Placeholder height when collapsed so the button has something to center on */}
          {!sidebarOpen && <div className="py-5" />}
        </div>

        {/* ── Collapsible content: mobile drawer or desktop panel ── */}
        {/* Mobile */}
        <div
          className={`sm:hidden flex flex-col overflow-y-auto ${mobileOpen ? 'flex' : 'hidden'}`}
          style={mobileOpen ? { maxHeight: '55vh' } : {}}
        >
          {sidebarContent}
        </div>
        {/* Desktop */}
        {sidebarOpen && (
          <div className="hidden sm:flex flex-col overflow-y-auto flex-1 sidebar-scroll">
            {sidebarContent}
          </div>
        )}
      </aside>

      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#0a0e1a' }}>
        {phase !== 'ready' && !error && <LoadingSpinner phase={phase} />}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="font-mono text-sm" style={{ color: '#ff4d6d' }}>
              ✗ {error}
            </div>
          </div>
        )}

        {phase !== 'loading' && !error && elements.length > 0 && (
          <div
            style={{
              position: 'absolute', inset: 0,
              opacity: phase === 'ready' ? 1 : 0,
              pointerEvents: phase === 'ready' ? 'auto' : 'none',
              transition: 'opacity 0.4s ease',
            }}
          >
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
          </div>
        )}

        {/* Search query badge */}
        {searchQuery && (
          <div
            className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 rounded text-[0.6rem] sm:text-xs font-mono pointer-events-none"
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

      </div>
    </div>
  )
}
