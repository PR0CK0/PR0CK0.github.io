import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import SiteFooter from '@/components/SiteFooter'
import PublicationIndex from '@/components/PublicationIndex'
import { loadPortfolioData } from '@/lib/yaml-loader'
import { getVisiblePublications } from '@/lib/publication-pages'
import type { Person } from '@/lib/schema'
import { LOADING_SCREEN } from '@/lib/ui-constants'

export default function Publications() {
  const [person, setPerson] = useState<Person | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    document.querySelector('main')?.scrollTo(0, 0)
    loadPortfolioData().then(data => { if (active) setPerson(data) }).catch(error => { if (active) setError(String(error.message ?? error)) })
    return () => { active = false }
  }, [])
  if (error) return <div className={LOADING_SCREEN}><p role="alert">{error}</p></div>
  if (!person) return <div className={LOADING_SCREEN} role="status">Loading publications…</div>
  return <>
    <SEO title="Publications" description={`Publications and research contributions by ${person.name}. Browse authors, venues, topics, and source links.`} path="/papers" />
    <PublicationIndex publications={getVisiblePublications(person)} />
    <SiteFooter name={person.name} />
  </>
}
