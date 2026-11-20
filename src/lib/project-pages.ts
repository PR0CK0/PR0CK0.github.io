import type { Person, Project } from './schema'

export type ProjectSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

export function sortProjects(projects: Project[], order: ProjectSort): Project[] {
  return [...projects].sort((a, b) => {
    const titleOrder = a.title.localeCompare(b.title)
    if (order === 'title-asc') return titleOrder
    if (order === 'title-desc') return -titleOrder
    if (!a.year || !b.year) return Number(Boolean(b.year)) - Number(Boolean(a.year)) || titleOrder
    const dateOrder = a.year.localeCompare(b.year)
    return (order === 'newest' ? -dateOrder : dateOrder) || titleOrder
  })
}

export function getVisibleProjects(person: Pick<Person, 'projects'>): Project[] {
  return (person.projects ?? []).filter(project => !project.graph_exclude)
}

export function projectPath(project: Project): string {
  return `/projects/${encodeURIComponent(project.page?.slug ?? project.id.replace(/^[^/]+\//, ''))}`
}
