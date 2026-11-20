import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '@/lib/schema'
import { getRecordCompetencies, type Competency } from '@/lib/competencies'
import { projectPath } from '@/lib/project-pages'
import { fmtSingleDate } from '@/lib/cv-data'
import { BTN_PRIMARY, BTN_SECONDARY, SECTION_LABEL } from '@/lib/ui-constants'

const CHIP = 'inline-block rounded border border-terminal-border bg-terminal-bg px-2 py-1 text-xs leading-relaxed text-terminal-text hover:border-terminal-green hover:text-terminal-green transition-colors'

function CompetencyLinks({ terms }: { terms: Competency[] }) {
  return <div className="flex flex-wrap gap-2">{terms.map(term => (
    <Link className={CHIP} key={term.id} to={`/graph?term=${encodeURIComponent(term.id)}`}>{term.label}</Link>
  ))}</div>
}

export function ProjectIndex({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('')
  const domains = [...new Set(projects.flatMap(project => getRecordCompetencies(project).filter(term => term.category === 'domains').map(term => term.label)))].sort()
  const search = query.trim().toLowerCase()
  const matches = projects.filter(project => {
    const terms = getRecordCompetencies(project)
    return (!domain || terms.some(term => term.category === 'domains' && term.label === domain))
      && [project.title, project.description, project.tagline, ...terms.map(term => term.label)].join(' ').toLowerCase().includes(search)
  })
  const sorted = [...matches].sort((a, b) => Number(Boolean(b.page)) - Number(Boolean(a.page)) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)))

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
    <header className="border-b border-terminal-border pb-8 mb-8">
      <p className={`${SECTION_LABEL} text-terminal-green mb-4`}>~/projects</p>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-terminal-text">Projects</h1>
      <p className="text-sm sm:text-base leading-relaxed text-terminal-muted mt-4 max-w-2xl">Software, experiments, and applied research.</p>
      <p className="text-xs text-terminal-muted mt-5"><span className="text-terminal-green">{projects.length}</span> projects <span aria-hidden="true">/</span> <span className="text-terminal-blue">{domains.length}</span> domains</p>
    </header>

    <div className="grid sm:grid-cols-[1fr_16rem] gap-4 mb-5">
      <label className="block text-xs text-terminal-muted">Search projects
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Title, topic, or technology…"
          className="mt-2 w-full rounded border border-terminal-border bg-terminal-surface text-terminal-text px-3 py-3 text-sm" />
      </label>
      <label className="block text-xs text-terminal-muted">Filter by domain
        <select value={domain} onChange={event => setDomain(event.target.value)} className="mt-2 w-full rounded border border-terminal-border bg-terminal-surface text-terminal-text px-3 py-3 text-sm">
          <option value="">All domains</option>
          {domains.map(label => <option key={label}>{label}</option>)}
        </select>
      </label>
    </div>
    <p role="status" className="text-xs text-terminal-muted mb-5">Showing {matches.length} of {projects.length} projects</p>
    {matches.length === 0 && <div className="border border-terminal-border rounded-lg p-8 text-sm">
      <p>No projects match these filters.</p>
      <button className={`${BTN_SECONDARY} mt-4`} onClick={() => { setQuery(''); setDomain('') }}>Clear filters</button>
    </div>}
    <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
      {sorted.map(project => {
        const topics = getRecordCompetencies(project).filter(term => term.category === 'domains').slice(0, 3)
        return <article key={project.id} data-project-card className="min-w-0 flex flex-col rounded-lg border border-terminal-border bg-terminal-surface p-5 sm:p-6 hover:border-terminal-green/50 transition-colors">
          <div className="flex items-center justify-between gap-3 text-xs mb-4 text-terminal-muted">
            <span>{project.year ? fmtSingleDate(project.year) : 'Project'}</span>
            {project.page && <span className="text-terminal-green">Project notes ↘</span>}
          </div>
          <h2 className="text-lg sm:text-xl leading-snug font-bold text-terminal-text break-words">
            <Link to={projectPath(project)} className="hover:text-terminal-green">{project.title}</Link>
          </h2>
          {(project.tagline || project.description) && <p className="mt-3 mb-5 text-sm leading-relaxed text-terminal-muted">{project.tagline || project.description}</p>}
          <div className="mt-auto pt-3">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-terminal-blue mb-5">{topics.map(term => <span key={term.id}>{term.label}</span>)}</div>
            <Link to={projectPath(project)} className="text-sm text-terminal-green hover:underline" aria-label={`View project: ${project.title}`}>View project <span aria-hidden="true">→</span></Link>
          </div>
        </article>
      })}
    </div>
  </div>
}

export function ProjectDetail({ project }: { project: Project }) {
  const terms = getRecordCompetencies(project)
  const domains = terms.filter(term => term.category === 'domains')
  const tools = terms.filter(term => !['domains', 'soft', 'personal'].includes(term.category))
  const skills = terms.filter(term => ['soft', 'personal'].includes(term.category))
  const groups = [{ label: 'Domains', terms: domains }, { label: 'Tools & technologies', terms: tools }, { label: 'Skills', terms: skills }]
  const resources = [
    ...(project.repo_url ? [{ label: 'Repository', url: project.repo_url }] : []),
    ...(project.url && project.url !== project.repo_url ? [{ label: 'Project website', url: project.url }] : []),
    ...(project.page?.links ?? []),
  ]

  return <article className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
    <Link to="/projects" className="text-sm text-terminal-green hover:underline">← All projects</Link>
    <header className="mt-8 mb-8 border-b border-terminal-border pb-8">
      {project.year && <p className={`${SECTION_LABEL} text-terminal-muted mb-4`}>{fmtSingleDate(project.year)}</p>}
      <h1 className="max-w-4xl text-2xl sm:text-4xl font-bold leading-tight tracking-tight text-terminal-text break-words">{project.title}</h1>
      {project.tagline && project.tagline !== project.description && <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-terminal-muted mt-5">{project.tagline}</p>}
      <div className="flex flex-wrap gap-3 mt-6">
        {resources.slice(0, 2).map((link, index) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={index === 0 ? BTN_PRIMARY : BTN_SECONDARY}>{link.label} ↗</a>)}
        <Link to={`/graph?term=${encodeURIComponent(project.id)}`} className={BTN_SECONDARY}>Explore connections →</Link>
      </div>
    </header>

    {project.page?.image && <figure className="mb-10 overflow-hidden rounded-lg border border-terminal-border bg-terminal-surface">
      <a href={project.page.image.src} target="_blank" rel="noopener noreferrer"><img src={project.page.image.src} alt={project.page.image.alt} className="w-full max-h-[32rem] object-contain" /></a>
      {project.page.image.caption && <figcaption className="p-4 border-t border-terminal-border text-xs leading-relaxed text-terminal-muted">{project.page.image.caption}</figcaption>}
    </figure>}

    <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem] gap-10 lg:gap-14 items-start">
      <div className="min-w-0 space-y-8">
        {project.description && <section>
          <h2 className="text-lg font-bold mb-3 text-terminal-text">Overview</h2>
          <p className="text-sm sm:text-base leading-7 text-terminal-muted">{project.description}</p>
        </section>}
        {project.page?.sections.map((section, index) => <section key={index}>
          <h2 className="text-lg font-bold mb-3 text-terminal-text">{section.heading}</h2>
          {section.paragraphs.map((paragraph, paragraphIndex) => <p className="text-sm sm:text-base leading-7 text-terminal-muted mb-3" key={paragraphIndex}>{paragraph}</p>)}
        </section>)}
      </div>
      <aside aria-label="Project details" className="min-w-0 rounded-lg border border-terminal-border bg-terminal-surface p-5 space-y-6">
        {resources.length > 0 && <section><h2 className={`${SECTION_LABEL} text-terminal-muted mb-3`}>Links & resources</h2><ul className="space-y-3 text-sm">{resources.map(link => <li key={link.url}><a className="text-terminal-green hover:underline break-words" href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a></li>)}</ul></section>}
        {groups.filter(group => group.terms.length).map(group => <section key={group.label}>
          <h2 className={`${SECTION_LABEL} text-terminal-muted mb-3`}>{group.label}</h2>
          <CompetencyLinks terms={group.terms} />
        </section>)}
      </aside>
    </div>
  </article>
}
