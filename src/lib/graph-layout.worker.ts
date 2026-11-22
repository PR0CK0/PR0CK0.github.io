import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'
import type { GraphPositions } from './graph-layout'

cytoscape.use(fcose)

self.onmessage = (event: MessageEvent<{ elements: cytoscape.ElementDefinition[] }>) => {
  const cy = cytoscape({
    headless: true,
    styleEnabled: true,
    elements: event.data.elements,
    style: [{ selector: 'node', style: { width: 'data(layoutWidth)', height: 'data(layoutHeight)' } }],
  })
  try {
    cy.layout({
      name: 'fcose',
      animate: false,
      fit: false,
      randomize: true,
      // Dimensions, including labels, were measured in the visible renderer.
      nodeDimensionsIncludeLabels: false,
      idealEdgeLength: 100,
      nodeRepulsion: 8000,
      numIter: 2500,
      sampleSize: 25,
      nodeSeparation: 75,
      piTol: 0.0000001,
    } as cytoscape.LayoutOptions).run()
    const positions: GraphPositions = {}
    cy.nodes().forEach(node => { positions[node.id()] = { ...node.position() } })
    self.postMessage({ positions })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Graph layout failed' })
  } finally {
    cy.destroy()
  }
}
