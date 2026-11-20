import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Publication } from '@/lib/schema'
import { selectPublications, PUBLICATION_STATUS_LABELS, type PublicationSort } from '@/lib/publication-pages'
import { getRecordCompetencies } from '@/lib/competencies'
import { fmtSingleDate } from '@/lib/cv-data'
import { BTN_SECONDARY, SECTION_LABEL } from '@/lib/ui-constants'

const CONTROL = 'mt-2 w-full rounded border border-terminal-border bg-terminal-surface text-terminal-text px-3 py-3 text-sm'

export default function PublicationIndex({ publications }: { publications: Publication[] }) {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<PublicationSort>('newest')
  const years = [...new Set(publications.flatMap(publication => publication.date ? [publication.date.slice(0, 4)] : []))].sort().reverse()
  const statuses = [...new Set(publications.flatMap(publication => publication.status ? [publication.status] : []))]
  const matches = selectPublications(publications, { query, year, status, sort })

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
    <header className="border-b border-terminal-border pb-8 mb-8">
      <p className={`${SECTION_LABEL} text-terminal-blue mb-4`}>~/papers</p>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-terminal-text">Publications</h1>
      <p className="text-sm sm:text-base leading-relaxed text-terminal-muted mt-4">Papers, proposals, and related research contributions.</p>
      <p className="text-xs text-terminal-muted mt-5"><span className="text-terminal-blue">{publications.length}</span> entries</p>
    </header>

    <div className="grid sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_8rem_14rem_12rem] gap-4 mb-5">
      <label className="block text-xs text-terminal-muted">Search publications
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Title, author, venue, or topic…" className={CONTROL} />
      </label>
      <label className="block text-xs text-terminal-muted">Year
        <select name="year" value={year} onChange={event => setYear(event.target.value)} className={CONTROL}>
          <option value="">All years</option>{years.map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="block text-xs text-terminal-muted">Classification
        <select name="status" value={status} onChange={event => setStatus(event.target.value)} className={CONTROL}>
          <option value="">All classifications</option>{statuses.map(value => <option key={value} value={value}>{PUBLICATION_STATUS_LABELS[value]}</option>)}
        </select>
      </label>
      <label className="block text-xs text-terminal-muted">Sort publications
        <select name="sort" value={sort} onChange={event => setSort(event.target.value as PublicationSort)} className={CONTROL}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
          <option value="title-asc">Name: A–Z</option><option value="title-desc">Name: Z–A</option>
        </select>
      </label>
    </div>
    <p role="status" className="text-xs text-terminal-muted mb-5">Showing {matches.length} of {publications.length} entries</p>
    {matches.length === 0 && <div className="border border-terminal-border rounded-lg p-8 text-sm">
      <p>No publications match these filters.</p>
      <button className={`${BTN_SECONDARY} mt-4`} onClick={() => { setQuery(''); setYear(''); setStatus('') }}>Clear filters</button>
    </div>}
    <div className="space-y-4">
      {matches.map(publication => <article key={publication.id} data-publication-card className="min-w-0 rounded-lg border border-terminal-border bg-terminal-surface p-5 sm:p-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-terminal-muted mb-3">
          {publication.date && <span>{fmtSingleDate(publication.date)}</span>}
          {publication.status && <span className="text-terminal-blue">{PUBLICATION_STATUS_LABELS[publication.status]}</span>}
        </div>
        <h2 className="text-lg sm:text-xl leading-snug font-bold text-terminal-text break-words">
          {publication.url ? <a href={publication.url} target="_blank" rel="noopener noreferrer" className="hover:text-terminal-green">{publication.title} ↗</a> : publication.title}
        </h2>
        {publication.authors?.length ? <p className="text-sm text-terminal-text mt-3 break-words">{publication.authors.join(', ')}</p> : null}
        {publication.venue && <p className="text-sm text-terminal-muted mt-2 break-words">{publication.venue}</p>}
        {publication.author_role && <p className="text-xs text-terminal-muted mt-2">{publication.author_role}</p>}
        {publication.abstract && <details className="mt-4 text-sm text-terminal-muted"><summary className="cursor-pointer text-terminal-blue">Abstract</summary><p className="mt-3 leading-7 whitespace-pre-line">{publication.abstract}</p></details>}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-terminal-blue">
          {getRecordCompetencies(publication).filter(term => term.category === 'domains').slice(0, 4).map(term => <Link key={term.id} className="hover:underline" to={`/graph?term=${encodeURIComponent(term.id)}`}>{term.label}</Link>)}
        </div>
        <div className="flex flex-wrap gap-5 mt-4 text-sm text-terminal-green">
          {publication.url && <a href={publication.url} target="_blank" rel="noopener noreferrer" className="hover:underline">Read publication ↗</a>}
          <Link to={`/graph?term=${encodeURIComponent(publication.id)}`} className="hover:underline">Explore connections →</Link>
        </div>
      </article>)}
    </div>
  </div>
}
