import type { Person, Publication } from './schema'
import { getRecordCompetencies } from './competencies'

export const PUBLICATION_STATUS_LABELS: Record<NonNullable<Publication['status']>, string> = {
  published: 'Published',
  awaiting_publication: 'Awaiting publication',
  in_progress: 'In progress',
  colleague_thesis: 'Colleague thesis',
  competition_proposal: 'Competition proposal',
  grant_proposal: 'Grant proposal',
  article: 'Article',
}

export type PublicationSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

export function getVisiblePublications(person: Pick<Person, 'publications'>): Publication[] {
  return (person.publications ?? []).filter(publication => publication.status !== 'in_progress')
}

export function selectPublications(publications: Publication[], filters: {
  query?: string; year?: string; status?: string; sort?: PublicationSort
} = {}): Publication[] {
  const { query = '', year = '', status = '', sort = 'newest' } = filters
  const search = query.trim().toLowerCase()
  return publications.filter(publication => (!year || publication.date?.slice(0, 4) === year)
    && (!status || publication.status === status)
    && [publication.title, ...(publication.authors ?? []), publication.venue, publication.abstract,
      ...getRecordCompetencies(publication).map(term => term.label)].join(' ').toLowerCase().includes(search))
    .sort((a, b) => {
      const titleOrder = a.title.localeCompare(b.title)
      if (sort === 'title-asc') return titleOrder
      if (sort === 'title-desc') return -titleOrder
      if (!a.date || !b.date) return Number(Boolean(b.date)) - Number(Boolean(a.date)) || titleOrder
      const dateOrder = a.date.localeCompare(b.date)
      return (sort === 'newest' ? -dateOrder : dateOrder) || titleOrder
    })
}
