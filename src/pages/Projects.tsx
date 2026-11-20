import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SEO from '@/components/SEO'
import SiteFooter from '@/components/SiteFooter'
import { ProjectDetail, ProjectIndex } from '@/components/ProjectViews'
import { loadPortfolioData } from '@/lib/yaml-loader'
import { getVisibleProjects, projectPath } from '@/lib/project-pages'
import type { Person } from '@/lib/schema'
import { LOADING_SCREEN } from '@/lib/ui-constants'

export default function Projects() {
  const { slug } = useParams()
  const [person, setPerson] = useState<Person | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    loadPortfolioData().then(data => { if (active) setPerson(data) }).catch(error => { if (active) setError(String(error.message ?? error)) })
    return () => { active = false }
  }, [])
  useEffect(() => { document.querySelector('main')?.scrollTo(0, 0) }, [slug])
  if (error) return <div className={LOADING_SCREEN}><p role="alert">{error}</p></div>
  if (!person) return <div className={LOADING_SCREEN} role="status">Loading projects…</div>
  const projects = getVisibleProjects(person)
  const project = slug ? projects.find(item => projectPath(item) === `/projects/${encodeURIComponent(slug)}`) : undefined
  if (slug && !project) return <div className="max-w-6xl mx-auto p-8">
    <SEO title="Project not found" description="This project page is unavailable." path={`/projects/${encodeURIComponent(slug)}`} noindex />
    <h1 className="text-2xl mb-5">Project not found</h1><Link className="text-terminal-green" to="/projects">← Browse projects</Link>
  </div>
  return <>
    <SEO title={project?.title ?? 'Projects'} description={project?.description || project?.tagline || `Projects by ${person.name}: software, experiments, and applied research.`} path={project ? projectPath(project) : '/projects'} />
    {project ? <ProjectDetail project={project} /> : <ProjectIndex projects={projects} />}
    <SiteFooter name={person.name} />
  </>
}
