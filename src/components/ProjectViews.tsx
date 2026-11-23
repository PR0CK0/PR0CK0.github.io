import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Project } from '@/lib/schema'
import { getRecordCompetencies, type Competency } from '@/lib/competencies'
import { projectPath, sortProjects, type ProjectSort } from '@/lib/project-pages'
import { fmtSingleDate } from '@/lib/cv-data'
import { BTN_SECONDARY, SECTION_LABEL } from '@/lib/ui-constants'

const CHIP = 'chamfer-chip inline-block border border-terminal-border bg-terminal-bg px-2 py-1 text-xs leading-relaxed text-terminal-text hover:border-terminal-green hover:text-terminal-green transition-colors'

function CompetencyLinks({ terms }: { terms: Competency[] }) {
  return <div className="flex flex-wrap gap-2">{terms.map(term => (
    <Link className={CHIP} key={term.id} to={`/graph?term=${encodeURIComponent(term.id)}`}>{term.label}</Link>
  ))}</div>
}

export function ProjectIndex({ projects }: { projects: Project[] }) {
  const { hash } = useLocation()
  useEffect(() => {
    const card = hash ? document.getElementById(hash.slice(1)) : null
    if (card) {
      const summary = card.querySelector('details')
      if (summary) summary.open = true
      card.scrollIntoView({ block: 'start' })
    } else document.querySelector('main')?.scrollTo(0, 0)
  }, [hash])
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('')
  const [sort, setSort] = useState<ProjectSort>('newest')
  const domains = [...new Set(projects.flatMap(project => getRecordCompetencies(project).filter(term => term.category === 'domains').map(term => term.label)))].sort()
  const search = query.trim().toLowerCase()
  const matches = projects.filter(project => {
    const terms = getRecordCompetencies(project)
    return (!domain || terms.some(term => term.category === 'domains' && term.label === domain))
      && [project.title, project.description, project.tagline, ...terms.map(term => term.label)].join(' ').toLowerCase().includes(search)
  })
  const sorted = sortProjects(matches, sort)

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
    <header className="border-b border-terminal-border pb-8 mb-8">
      <p className={`${SECTION_LABEL} text-terminal-green mb-4`}>~/projects</p>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-terminal-text">Projects</h1>
      <p className="text-sm sm:text-base leading-relaxed text-terminal-muted mt-4 max-w-2xl">Software, experiments, and applied research.</p>
      <p className="text-xs text-terminal-muted mt-5"><span className="text-terminal-green">{projects.length}</span> projects <span aria-hidden="true">/</span> <span className="text-terminal-blue">{domains.length}</span> domains</p>
    </header>

    <div className="grid sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_12rem] gap-4 mb-5">
      <label className="block text-xs text-terminal-muted">Search projects
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Title, topic, or technology…"
          className="mt-2 w-full border border-terminal-border bg-terminal-surface text-terminal-text px-3 py-3 text-sm" />
      </label>
      <label className="block text-xs text-terminal-muted">Filter by domain
        <select name="domain" value={domain} onChange={event => setDomain(event.target.value)} className="mt-2 w-full border border-terminal-border bg-terminal-surface text-terminal-text px-3 py-3 text-sm">
          <option value="">All domains</option>
          {domains.map(label => <option key={label}>{label}</option>)}
        </select>
      </label>
      <label className="block text-xs text-terminal-muted">Sort projects
        <select name="sort" value={sort} onChange={event => setSort(event.target.value as ProjectSort)} className="mt-2 w-full border border-terminal-border bg-terminal-surface text-terminal-text px-3 py-3 text-sm">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title-asc">Name: A–Z</option>
          <option value="title-desc">Name: Z–A</option>
        </select>
      </label>
    </div>
    <p role="status" className="text-xs text-terminal-muted mb-5">Showing {matches.length} of {projects.length} projects</p>
    {matches.length === 0 && <div className="border border-terminal-border p-8 text-sm">
      <p>No projects match these filters.</p>
      <button className={`${BTN_SECONDARY} mt-4`} onClick={() => { setQuery(''); setDomain('') }}>Clear filters</button>
    </div>}
    <div className="space-y-4">
      {sorted.map(project => {
        const terms = getRecordCompetencies(project)
        const resources = [
          ...(project.repo_url ? [{ label: 'Repository', url: project.repo_url }] : []),
          ...(project.url && project.url !== project.repo_url ? [{ label: 'Project website', url: project.url }] : []),
          ...(project.page?.links ?? []),
        ]
        const hasSummary = project.description || project.page?.sections.length || project.page?.image
        return <article key={project.id} id={projectPath(project).split('#')[1]} data-project-card className="chamfer-card scroll-mt-4 min-w-0 border border-terminal-border bg-terminal-surface p-5 sm:p-6">
          {project.year && <p className="text-xs mb-3 text-terminal-muted">{fmtSingleDate(project.year)}</p>}
          <h2 className="text-lg sm:text-xl leading-snug font-bold text-terminal-text break-words">{project.title}</h2>
          {project.tagline && <p className="mt-3 text-sm leading-relaxed text-terminal-muted">{project.tagline}</p>}
          {hasSummary && <details className="mt-4 text-sm text-terminal-muted">
            <summary className="cursor-pointer text-terminal-blue">Summary</summary>
            {project.description && <p className="mt-3 leading-7 whitespace-pre-line">{project.description}</p>}
            {project.page?.sections.map((section, index) => <section key={index} className="mt-4">
              <h3 className="font-bold text-terminal-text">{section.heading}</h3>
              {section.paragraphs.map((paragraph, paragraphIndex) => <p className="mt-2 leading-7" key={paragraphIndex}>{paragraph}</p>)}
            </section>)}
            {project.page?.image && <figure className="mt-4 border border-terminal-border">
              <img loading="lazy" src={project.page.image.src} alt={project.page.image.alt} className="w-full max-h-80 object-contain" />
              {project.page.image.caption && <figcaption className="p-3 text-xs">{project.page.image.caption}</figcaption>}
            </figure>}
          </details>}
          {terms.length > 0 && <div className="mt-4"><CompetencyLinks terms={terms} /></div>}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-terminal-green">
            {resources.map(link => <a key={link.url} className="hover:underline" href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}
            <Link className="hover:underline" to={`/graph?term=${encodeURIComponent(project.id)}`}>Explore connections →</Link>
          </div>
        </article>
      })}
    </div>
  </div>
}
