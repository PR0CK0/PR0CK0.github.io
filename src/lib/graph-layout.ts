import type cytoscape from 'cytoscape'

export type GraphPositions = Record<string, { x: number; y: number }>

export function startGraphLayout(
  cy: cytoscape.Core,
  onComplete: (positions: GraphPositions) => void,
  onError: (message: string) => void,
): () => void {
  const worker = new Worker(new URL('./graph-layout.worker.ts', import.meta.url), { type: 'module' })
  let active = true
  const cancel = () => {
    if (!active) return
    active = false
    worker.terminate()
  }
  worker.onmessage = (event: MessageEvent<{ positions: GraphPositions; error?: string }>) => {
    if (!active) return
    cancel()
    if (cy.destroyed()) return
    if (event.data.error) onError(event.data.error)
    else onComplete(event.data.positions)
  }
  worker.onerror = event => {
    event.preventDefault()
    if (!active) return
    cancel()
    onError(event.message || 'Graph layout failed')
  }
  worker.postMessage({ elements: [
    ...cy.nodes().map(node => {
      const { w, h } = node.layoutDimensions({ nodeDimensionsIncludeLabels: true })
      return { data: { id: node.id(), layoutWidth: w, layoutHeight: h } }
    }),
    ...cy.edges().map(edge => ({ data: { id: edge.id(), source: edge.source().id(), target: edge.target().id() } })),
  ] })
  return cancel
}
