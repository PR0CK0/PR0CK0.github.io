export function projectRoutes(person) {
  return (person.projects ?? []).filter(project => !project.graph_exclude).map(project => {
    const slug = project.page?.slug ?? project.id.replace(/^[^/]+\//, '')
    const path = `/projects/${encodeURIComponent(slug)}`
    return { path, dir: path.slice(1), projectId: project.id, target: `/projects/#${encodeURIComponent(slug)}` }
  })
}
