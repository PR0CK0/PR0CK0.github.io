import type { Person, Project } from './schema'

export function getVisibleProjects(person: Pick<Person, 'projects'>): Project[] {
  return (person.projects ?? []).filter(project => !project.graph_exclude)
}

export function projectPath(project: Project): string {
  return `/projects/${encodeURIComponent(project.page?.slug ?? project.id.replace(/^[^/]+\//, ''))}`
}
