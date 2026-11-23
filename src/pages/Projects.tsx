import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import SiteFooter from '@/components/SiteFooter'
import { ProjectIndex } from '@/components/ProjectViews'
import { loadPortfolioData } from '@/lib/yaml-loader'
import { getVisibleProjects } from '@/lib/project-pages'
import type { Person } from '@/lib/schema'
import { LOADING_SCREEN } from '@/lib/ui-constants'

export default function Projects() {
  const [person, setPerson] = useState<Person | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    loadPortfolioData().then(data => { if (active) setPerson(data) }).catch(error => { if (active) setError(String(error.message ?? error)) })
    return () => { active = false }
  }, [])
  if (error) return <div className={LOADING_SCREEN}><p role="alert">{error}</p></div>
  if (!person) return <div className={LOADING_SCREEN} role="status">Loading projects…</div>
  const projects = getVisibleProjects(person)
  return <>
    <SEO title="Projects" description={`Projects by ${person.name}: software, experiments, and applied research.`} path="/projects" />
    <ProjectIndex projects={projects} />
    <SiteFooter name={person.name} />
  </>
}
