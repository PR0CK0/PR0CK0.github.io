import type { Person } from './schema'
import { TECH_CATEGORIES } from './tech-categories'

export interface CyNode {
  data: {
    id: string
    label: string
    type: 'person' | 'education' | 'work' | 'publication' | 'project' | 'skill' | 'award' | 'certificate' | 'talk'
    subtitle?: string
    detail?: string
    year?: string
    category?: string
  }
}

export interface CyEdge {
  data: {
    id: string
    source: string
    target: string
    label?: string
    type?: string
  }
}

export interface GraphData {
  nodes: CyNode[]
  edges: CyEdge[]
}

function techId(tech: string) {
  return `skill-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
}

export function buildGraph(person: Person): GraphData {
  const nodes: CyNode[] = []
  const edges: CyEdge[] = []
  const addedNodeIds = new Set<string>()
  const addedEdgeIds = new Set<string>()

  function addNode(node: CyNode) {
    if (!addedNodeIds.has(node.data.id)) {
      nodes.push(node)
      addedNodeIds.add(node.data.id)
    }
  }

  function addEdge(edge: CyEdge) {
    if (!addedEdgeIds.has(edge.data.id)) {
      edges.push(edge)
      addedEdgeIds.add(edge.data.id)
    }
  }

  // Connect an entity to each of its technology nodes (must be called after skill
  // nodes are built so addedNodeIds contains them)
  function linkTechs(entityId: string, techs: string[] | undefined) {
    techs?.forEach((tech) => {
      const sid = techId(tech)
      if (addedNodeIds.has(sid)) {
        addEdge({ data: { id: `e-${entityId}-${sid}`, source: entityId, target: sid, type: 'skill-usage' } })
      }
    })
  }

  // ─── Person ─────────────────────────────────────────────────────────────────
  const personId = person.id
  addNode({ data: { id: personId, label: person.name, type: 'person', subtitle: person.title } })

  // ─── Skill nodes — aggregated from all technology arrays ────────────────────
  const allTechs = new Set([
    ...(person.work_experiences ?? []).flatMap((w) => w.technologies ?? []),
    ...(person.projects ?? []).flatMap((p) => p.technologies ?? []),
    ...(person.publications ?? []).slice(0, 20).flatMap((p) => p.technologies ?? []),
    ...(person.courses ?? []).flatMap((c) => c.technologies ?? []),
    ...(person.extracurriculars ?? []).flatMap((e) => e.technologies ?? []),
  ])
  allTechs.forEach((tech) => {
    addNode({
      data: {
        id: techId(tech),
        label: tech,
        type: 'skill',
        category: TECH_CATEGORIES[tech],
      },
    })
  })

  // ─── Education ───────────────────────────────────────────────────────────────
  person.education?.forEach((edu) => {
    addNode({
      data: { id: edu.id, label: edu.degree, type: 'education', subtitle: edu.institution, year: edu.end_date?.slice(0, 4) },
    })
    addEdge({ data: { id: `e-${personId}-${edu.id}`, source: personId, target: edu.id, label: 'studied_at' } })
  })

  // ─── Work ────────────────────────────────────────────────────────────────────
  person.work_experiences?.forEach((work) => {
    addNode({
      data: { id: work.id, label: work.title, type: 'work', subtitle: work.organization, year: work.start_date?.slice(0, 4) },
    })
    addEdge({ data: { id: `e-${personId}-${work.id}`, source: personId, target: work.id, label: 'worked_at' } })
    linkTechs(work.id, work.technologies)
  })

  // ─── Publications ────────────────────────────────────────────────────────────
  person.publications?.slice(0, 20).forEach((pub) => {
    addNode({
      data: {
        id: pub.id,
        label: pub.title.length > 45 ? pub.title.slice(0, 45) + '…' : pub.title,
        type: 'publication',
        subtitle: pub.venue,
        year: pub.date?.slice(0, 4),
        detail: pub.status,
      },
    })
    addEdge({ data: { id: `e-${personId}-${pub.id}`, source: personId, target: pub.id, label: 'authored' } })
    linkTechs(pub.id, pub.technologies)
  })

  // ─── Projects ────────────────────────────────────────────────────────────────
  person.projects?.slice(0, 15).forEach((proj) => {
    addNode({
      data: {
        id: proj.id,
        label: proj.title,
        type: 'project',
        subtitle: proj.technologies?.slice(0, 3).join(', '),
        year: proj.year,
      },
    })
    addEdge({ data: { id: `e-${personId}-${proj.id}`, source: personId, target: proj.id, label: 'built' } })
    linkTechs(proj.id, proj.technologies)
  })

  // ─── Awards ──────────────────────────────────────────────────────────────────
  person.awards?.forEach((award) => {
    addNode({
      data: { id: award.id, label: award.title, type: 'award', subtitle: award.issuer, year: award.date?.slice(0, 4) },
    })
    addEdge({ data: { id: `e-${personId}-${award.id}`, source: personId, target: award.id, label: 'received' } })
  })

  // ─── Talks ───────────────────────────────────────────────────────────────────
  person.talks?.forEach((talk) => {
    addNode({
      data: {
        id: talk.id,
        label: talk.title.length > 45 ? talk.title.slice(0, 45) + '…' : talk.title,
        type: 'talk',
        subtitle: talk.venue,
        year: talk.date?.slice(0, 4),
      },
    })
    addEdge({ data: { id: `e-${personId}-${talk.id}`, source: personId, target: talk.id, label: 'presented' } })
  })

  return { nodes, edges }
}
