import type { Person } from './schema'

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

export function buildGraph(person: Person): GraphData {
  const nodes: CyNode[] = []
  const edges: CyEdge[] = []
  const addedNodeIds = new Set<string>()

  function addNode(node: CyNode) {
    if (!addedNodeIds.has(node.data.id)) {
      nodes.push(node)
      addedNodeIds.add(node.data.id)
    }
  }

  const personId = person.id
  addNode({
    data: {
      id: personId,
      label: person.name,
      type: 'person',
      subtitle: person.title,
    },
  })

  person.education?.forEach((edu) => {
    addNode({
      data: {
        id: edu.id,
        label: edu.degree,
        type: 'education',
        subtitle: edu.institution,
        year: edu.end_date?.slice(0, 4),
      },
    })
    edges.push({
      data: { id: `e-${personId}-${edu.id}`, source: personId, target: edu.id, label: 'studied_at' },
    })
  })

  person.work_experiences?.forEach((work) => {
    addNode({
      data: {
        id: work.id,
        label: work.title,
        type: 'work',
        subtitle: work.organization,
        year: work.start_date?.slice(0, 4),
      },
    })
    edges.push({
      data: { id: `e-${personId}-${work.id}`, source: personId, target: work.id, label: 'worked_at' },
    })

    work.technologies?.forEach((tech) => {
      const skillId = `skill-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      if (addedNodeIds.has(skillId)) {
        edges.push({
          data: { id: `e-${work.id}-${skillId}`, source: work.id, target: skillId, label: 'used', type: 'skill-usage' },
        })
      }
    })
  })

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
    edges.push({
      data: { id: `e-${personId}-${pub.id}`, source: personId, target: pub.id, label: 'authored' },
    })
  })

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
    edges.push({
      data: { id: `e-${personId}-${proj.id}`, source: personId, target: proj.id, label: 'built' },
    })
  })

  person.skills?.forEach((skill) => {
    const skillId = `skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    addNode({
      data: {
        id: skillId,
        label: skill.name,
        type: 'skill',
        category: skill.category,
        subtitle: skill.years_experience ? `${skill.years_experience}yr` : undefined,
      },
    })
    edges.push({
      data: { id: `e-${personId}-${skillId}`, source: personId, target: skillId, label: 'has_skill' },
    })
  })

  person.awards?.forEach((award) => {
    addNode({
      data: {
        id: award.id,
        label: award.title,
        type: 'award',
        subtitle: award.issuer,
        year: award.date?.slice(0, 4),
      },
    })
    edges.push({
      data: { id: `e-${personId}-${award.id}`, source: personId, target: award.id, label: 'received' },
    })
  })

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
    edges.push({
      data: { id: `e-${personId}-${talk.id}`, source: personId, target: talk.id, label: 'presented' },
    })
  })

  return { nodes, edges }
}
