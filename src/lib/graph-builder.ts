import type { Person } from './schema'
import { TECH_CATEGORIES } from './tech-categories'

export interface CyNode {
  data: {
    id: string
    label: string
    type: 'person' | 'education' | 'work' | 'publication' | 'project' | 'skill' | 'domain' | 'soft_skill' | 'award' | 'certificate' | 'talk' | 'course'
    subtitle?: string
    detail?: string
    year?: string
    category?: string
    url?: string
    repo_url?: string
    doi?: string
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

  // Connect an entity to each of its technology nodes
  function linkTechs(entityId: string, techs: string[] | undefined) {
    techs?.forEach((tech) => {
      const sid = techId(tech)
      if (addedNodeIds.has(sid)) {
        addEdge({ data: { id: `e-${entityId}-${sid}`, source: entityId, target: sid, type: 'skill-usage' } })
      }
    })
  }

  // Connect an entity to each of its domain nodes
  function linkDomains(entityId: string, domains: string[] | undefined) {
    domains?.forEach((d) => {
      const did = domainId(d)
      if (addedNodeIds.has(did)) {
        addEdge({ data: { id: `e-${entityId}-${did}`, source: entityId, target: did, type: 'domain-usage' } })
      }
    })
  }

  // Connect an entity to each of its soft skill nodes
  function linkSoftSkills(entityId: string, skills: string[] | undefined) {
    skills?.forEach((s) => {
      const ssid = softSkillId(s)
      if (addedNodeIds.has(ssid)) {
        addEdge({ data: { id: `e-${entityId}-${ssid}`, source: entityId, target: ssid, type: 'softskill-usage' } })
      }
    })
  }

  // ─── Person ─────────────────────────────────────────────────────────────────
  const personId = person.id
  addNode({ data: { id: personId, label: person.name, type: 'person', subtitle: person.title } })

  const allSections = [
    ...(person.work_experiences ?? []),
    ...(person.projects ?? []),
    ...(person.publications ?? []).slice(0, 20),
    ...(person.courses ?? []),
    ...(person.talks ?? []),
    ...(person.certificates ?? []),
  ] as Array<{ technologies?: string[]; domains?: string[]; soft_skills?: string[] }>

  // ─── Skill nodes — aggregated from all entity sources ───────────────────────
  const allTechs = new Set(allSections.flatMap((e) => e.technologies ?? []))
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

  // ─── Domain nodes ────────────────────────────────────────────────────────────
  const allDomains = new Set(allSections.flatMap((e) => e.domains ?? []))
  allDomains.forEach((d) => {
    addNode({ data: { id: domainId(d), label: d, type: 'domain' } })
  })

  // ─── Soft skill nodes ─────────────────────────────────────────────────────────
  const allSoftSkills = new Set(allSections.flatMap((e) => e.soft_skills ?? []))
  allSoftSkills.forEach((s) => {
    addNode({ data: { id: softSkillId(s), label: s, type: 'soft_skill' } })
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
    linkTechs(work.id, work.technologies)
    linkDomains(work.id, work.domains)
    linkSoftSkills(work.id, work.soft_skills)
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
        url: pub.url,
        doi: pub.doi,
      },
    })
    addEdge({ data: { id: `e-${personId}-${pub.id}`, source: personId, target: pub.id, label: 'authored' } })
    linkTechs(pub.id, pub.technologies)
    linkDomains(pub.id, pub.domains)
  })

  // ─── Projects ────────────────────────────────────────────────────────────────
  person.projects?.forEach((proj) => {
    addNode({
      data: {
        id: proj.id,
        label: proj.title,
        type: 'project',
        subtitle: proj.technologies?.slice(0, 3).join(', '),
        year: proj.year,
        url: proj.url,
        repo_url: proj.repo_url,
      },
    })
    addEdge({ data: { id: `e-${personId}-${proj.id}`, source: personId, target: proj.id, label: 'built' } })
    linkTechs(proj.id, proj.technologies)
    linkDomains(proj.id, proj.domains)
    linkSoftSkills(proj.id, proj.soft_skills)
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
    linkTechs(cid, course.technologies)
    linkDomains(cid, course.domains)
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
        url: talk.url,
      },
    })
    addEdge({ data: { id: `e-${personId}-${talk.id}`, source: personId, target: talk.id, label: 'presented' } })
    linkDomains(talk.id, talk.domains)
    linkSoftSkills(talk.id, talk.soft_skills)
  })

  return { nodes, edges }
}
