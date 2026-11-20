import { expect, it } from 'vitest'
import { getVisiblePublications, selectPublications } from '../publication-pages'
import type { Publication } from '../schema'

const publications: Publication[] = [
  { id: 'pub/z', title: 'Zulu', date: '2025-12', status: 'published', authors: ['Alice'], venue: 'Example Journal' },
  { id: 'pub/b', title: 'Beta', date: '2026-02', status: 'awaiting_publication', domains: ['Knowledge Graphs'] },
  { id: 'pub/a', title: 'Alpha', date: '2026-02', status: 'published' },
  { id: 'pub/c', title: 'Charlie', status: 'colleague_thesis' },
]

it('uses the homepage visibility policy, keeping related contributions distinct from work in progress', () => {
  expect(getVisiblePublications({ publications: [...publications, { id: 'pub/draft', title: 'Draft', status: 'in_progress' }] })).toEqual(publications)
})

it('combines author, venue and topic searches with year and classification filters', () => {
  expect(selectPublications(publications, { query: ' alice ', year: '2025', status: 'published' })).toEqual([publications[0]])
  expect(selectPublications(publications, { query: 'Example Journal' })).toEqual([publications[0]])
  expect(selectPublications(publications, { query: 'knowledge graphs', year: '2025' })).toEqual([])
  expect(selectPublications(publications, { query: 'knowledge graphs' })).toEqual([publications[1]])
})

it('supports date and name sorting, resolves date ties by title, and keeps undated work last', () => {
  expect(selectPublications(publications).map(pub => pub.title)).toEqual(['Alpha', 'Beta', 'Zulu', 'Charlie'])
  expect(selectPublications(publications, { sort: 'oldest' }).map(pub => pub.title)).toEqual(['Zulu', 'Alpha', 'Beta', 'Charlie'])
  expect(selectPublications(publications, { sort: 'title-asc' }).map(pub => pub.title)).toEqual(['Alpha', 'Beta', 'Charlie', 'Zulu'])
  expect(selectPublications(publications, { sort: 'title-desc' }).map(pub => pub.title)).toEqual(['Zulu', 'Charlie', 'Beta', 'Alpha'])
  expect(publications[0].title).toBe('Zulu')
})
