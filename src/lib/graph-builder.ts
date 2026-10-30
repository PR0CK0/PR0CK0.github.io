import type { Person } from './schema'
import { COMPETENCY_CATEGORIES } from './tech-categories'

export interface CyNode {
  data: {
    id: string
    label: string
    type: 'person' | 'education' | 'work' | 'publication' | 'project' | 'extracurricular' | 'skill' | 'domain' | 'soft_skill' | 'personal_skill' | 'award' | 'certificate' | 'talk' | 'course' | 'associate'
    subtitle?: string
    detail?: string
    year?: string
    category?: string
    url?: string
    repo_url?: string
    doi?: string
    description?: string
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

function domainId(domain: string) {
  return `domain-${domain.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
}

function softSkillId(skill: string) {
  return `softskill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
}

function personalSkillId(skill: string) {
  return `personalskill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
}

function courseId(number: string) {
  return `course-${number.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
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

  // Create competency nodes and their evidence edges together, only for included records.
  function linkCompetencies(entityId: string, entry: {
    technologies?: string[]; domains?: string[]; soft_skills?: string[]; personal_skills?: string[]
  }) {
    const fields = [
      ['technologies', techId, 'skill', 'skill-usage'],
      ['domains', domainId, 'domain', 'domain-usage'],
      ['soft_skills', softSkillId, 'soft_skill', 'softskill-usage'],
      ['personal_skills', personalSkillId, 'personal_skill', 'personalskill-usage'],
    ] as const
    for (const [field, makeId, type, edgeType] of fields) {
      for (const label of entry[field] ?? []) {
        const id = makeId(label)
        addNode({ data: {
          id, label, type,
          ...(type === 'skill' ? { category: COMPETENCY_CATEGORIES[label] } : {}),
        } })
        addEdge({ data: { id: `e-${entityId}-${id}`, source: entityId, target: id, type: edgeType } })
      }
    }
  }

  // ─── Person ─────────────────────────────────────────────────────────────────
  const personId = person.id
  addNode({ data: { id: personId, label: person.name, type: 'person', subtitle: person.title } })

  const projects = (person.projects ?? []).filter(p => !p.cv_exclude)

  // ─── Education ───────────────────────────────────────────────────────────────
  person.education?.forEach((edu) => {
    addNode({
      data: { id: edu.id, label: edu.degree, type: 'education', subtitle: edu.institution, year: edu.end_date?.slice(0, 4) },
    })
    addEdge({ data: { id: `e-${personId}-${edu.id}`, source: personId, target: edu.id, label: 'studied_at' } })
    linkCompetencies(edu.id, edu)
  })

  // ─── Work ────────────────────────────────────────────────────────────────────
  person.work_experiences?.filter(w => !w.graph_exclude).forEach((work) => {
    addNode({
      data: {
        id: work.id, label: work.title, type: 'work', subtitle: work.organization,
        year: work.start_date
          ? (() => {
              const fmt = (d: string) => { const [y, m] = d.split('-'); return m ? `${['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][+m-1]} ${y}` : y }
              const end = work.is_current ? 'present' : (work.end_date ? fmt(work.end_date) : '?')
              return `${fmt(work.start_date)} – ${end}`
            })()
          : undefined,
      },
    })
    addEdge({ data: { id: `e-${personId}-${work.id}`, source: personId, target: work.id, label: 'worked_at' } })
    linkCompetencies(work.id, work)
  })

  // ─── Publications ────────────────────────────────────────────────────────────
  person.publications?.forEach((pub) => {
    addNode({
      data: {
        id: pub.id,
        label: pub.title.length > 45 ? pub.title.slice(0, 45) + '…' : pub.title,
        type: 'publication',
        subtitle: pub.venue,
        year: pub.date?.slice(0, 4),
        detail: pub.status,
        url: pub.url,
        doi: pub.doi,
      },
    })
    addEdge({ data: { id: `e-${personId}-${pub.id}`, source: personId, target: pub.id, label: 'authored' } })
    linkCompetencies(pub.id, pub)
  })

  // ─── Projects ────────────────────────────────────────────────────────────────
  projects.forEach((proj) => {
    addNode({
      data: {
        id: proj.id,
        label: proj.title,
        type: 'project',
        year: proj.year,
        url: proj.url,
        repo_url: proj.repo_url,
        description: proj.tagline ?? proj.description,
      },
    })
    addEdge({ data: { id: `e-${personId}-${proj.id}`, source: personId, target: proj.id, label: 'built' } })
    linkCompetencies(proj.id, proj)
  })

  // ─── Courses ─────────────────────────────────────────────────────────────────
  person.courses?.forEach((course) => {
    const cid = courseId(course.number)
    addNode({
      data: {
        id: cid,
        label: course.name.length > 40 ? course.name.slice(0, 40) + '…' : course.name,
        type: 'course',
        subtitle: course.number,
      },
    })
    addEdge({ data: { id: `e-${personId}-${cid}`, source: personId, target: cid, label: 'took' } })
    linkCompetencies(cid, course)
  })

  // ─── Awards ──────────────────────────────────────────────────────────────────
  person.awards?.forEach((award) => {
    addNode({
      data: { id: award.id, label: award.title, type: 'award', subtitle: award.issuer, year: award.date?.slice(0, 4) },
    })
    addEdge({ data: { id: `e-${personId}-${award.id}`, source: personId, target: award.id, label: 'received' } })
  })

  // ─── Certificates ────────────────────────────────────────────────────────────
  person.certificates?.forEach((cert) => {
    if (cert.deprecated) return
    addNode({
      data: { id: cert.id, label: cert.title, type: 'certificate', subtitle: cert.issuer, year: cert.date?.slice(0, 4), url: cert.url },
    })
    addEdge({ data: { id: `e-${personId}-${cert.id}`, source: personId, target: cert.id, label: 'earned' } })
    linkCompetencies(cert.id, cert)
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
        url: talk.url,
      },
    })
    addEdge({ data: { id: `e-${personId}-${talk.id}`, source: personId, target: talk.id, label: 'presented' } })
    linkCompetencies(talk.id, talk)
  })

  // ─── Extracurriculars ─────────────────────────────────────────────────────────
  person.extracurriculars?.forEach((extra) => {
    addNode({
      data: {
        id: extra.id,
        label: extra.title.length > 45 ? extra.title.slice(0, 45) + '…' : extra.title,
        type: 'extracurricular',
        subtitle: extra.organization,
        year: extra.date?.slice(0, 4),
        url: extra.url,
      },
    })
    addEdge({ data: { id: `e-${personId}-${extra.id}`, source: personId, target: extra.id, label: 'contributed' } })
    linkCompetencies(extra.id, extra)
  })

  // ─── Associates ───────────────────────────────────────────────────────────
  person.associates?.forEach((assoc) => {
    addNode({
      data: {
        id: assoc.id,
        label: assoc.name,
        type: 'associate',
        subtitle: assoc.title,
        detail: assoc.relationship,
        url: assoc.social_links?.[0]?.url,
      },
    })
    addEdge({ data: { id: `e-${personId}-${assoc.id}`, source: personId, target: assoc.id, label: assoc.relationship ?? 'associate' } })
  })

  return { nodes, edges }
}
