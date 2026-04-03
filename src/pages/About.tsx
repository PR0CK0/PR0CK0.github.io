import { useState, useEffect } from 'react'
import { loadPortfolioData } from '@/lib/yaml-loader'
import type { Person } from '@/lib/schema'
import { fmtSingleDate } from '@/lib/cv-data'
import SEO from '@/components/SEO'
import SiteFooter from '@/components/SiteFooter'
import { PAGE_TITLE_SM, SECTION_LABEL, BODY_TEXT, META_TEXT, LOADING_SCREEN } from '@/lib/ui-constants'

export default function About() {
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolioData()
      .then(data => { setPerson(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className={LOADING_SCREEN}>
        <span className="text-terminal-green text-sm animate-pulse">loading...</span>
      </div>
    )
  }

  if (!person) return null

  const funAwards = (person.awards ?? []).filter(a => a.about_only)
  const aboutExtras = (person.extracurriculars ?? []).filter((e: any) => e.cv_exclude)

  const AWARD_GROUPS: Array<{ label: string; ids: string[] }> = [
    {
      label: 'Quantifications',
      ids: ['award/act-top-1-percent'],
    },
    {
      label: 'Junior High / High School',
      ids: [
        'award/florida-bright-futures',
        'award/presidents-education-award',
        'award/principals-list',
        'award/national-honor-society',
        'award/national-junior-honor-society',
        'award/math-contest-5th-place',
        'award/science-club',
        'award/egg-drop-1st-place',
        'award/creative-essay-winner',
        'award/faacs-fine-arts-1st',
      ],
    },
    {
      label: 'Elementary School',
      ids: ['award/beta-club', 'award/regional-spelling-bee'],
    },
  ]

  const sections: Array<{ label: string; value: string | string[] }> = [
    { label: 'Birth Year', value: String(person.birth_year ?? '') },
    { label: 'MBTI Type', value: person.mbti ?? '' },
    { label: 'Hobbies', value: person.hobbies ?? [] },
    { label: 'Favorite Artists', value: person.favorite_artists ?? [] },
    { label: 'Favorite Music', value: person.favorite_music ?? [] },
    { label: 'Favorite Books', value: person.favorite_books ?? [] },
    { label: 'Favorite Show', value: person.favorite_show ?? '' },
  ].filter(s => (Array.isArray(s.value) ? s.value.length > 0 : s.value !== ''))

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono">
      <SEO
        title="About"
        description="About Tyler T. Procko — hobbies, interests, and favorites."
        path="/about"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14 text-[0.9em]">
        <h1 className={`${PAGE_TITLE_SM} text-terminal-green mb-1`}>
          ~/about
        </h1>
        <p className={`text-terminal-muted ${META_TEXT} mb-8`}>
          The man behind the terminal.
        </p>

        <div className="space-y-6">
          {sections.map(({ label, value }) => (
            <div key={label} className="border-b border-terminal-border/30 pb-4">
              <h2 className={`${SECTION_LABEL} text-terminal-amber mb-2`}>
                {label}
              </h2>
              {Array.isArray(value) ? (
                <p className={`text-terminal-text ${BODY_TEXT}`}>{value.join(', ')}</p>
              ) : (
                <p className={`text-terminal-text ${BODY_TEXT}`}>{value}</p>
              )}
            </div>
          ))}

          {aboutExtras.length > 0 && (
            <div className="border-b border-terminal-border/30 pb-4">
              <h2 className={`${SECTION_LABEL} text-terminal-amber mb-4`}>
                Volunteer & Service
              </h2>
              <ul className="space-y-4">
                {aboutExtras.map((e: any) => (
                  <li key={e.id}>
                    <div className={`grid grid-cols-[1fr_7rem] sm:grid-cols-[1fr_8.5rem] gap-3 ${BODY_TEXT}`}>
                      <div>
                        <span className="text-terminal-text font-semibold">{e.title}</span>
                        {e.organization && (
                          <span className="text-terminal-muted"> – {e.organization}</span>
                        )}
                      </div>
                      <span className="text-terminal-muted text-right">{e.date ?? ''}</span>
                    </div>
                    {e.bullets && e.bullets.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {e.bullets.map((b: string, bi: number) => (
                          <li key={bi} className={`${BODY_TEXT} text-terminal-text flex gap-2`}>
                            <span className="shrink-0">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {funAwards.length > 0 && (
            <div className="border-b border-terminal-border/30 pb-4">
              <h2 className={`${SECTION_LABEL} text-terminal-amber mb-4`}>
                Fun Awards
              </h2>
              <div className="space-y-6">
                {AWARD_GROUPS.map(group => {
                  const grouped = group.ids
                    .map(id => funAwards.find(a => a.id === id))
                    .filter((a): a is NonNullable<typeof a> => !!a)
                  if (grouped.length === 0) return null
                  return (
                    <div key={group.label}>
                      <h3 className={`${SECTION_LABEL} text-terminal-green mb-2 border-b border-terminal-border/20 pb-1`}>
                        {group.label}
                      </h3>
                      <ul className="space-y-1">
                        {grouped.map(award => {
                          const dateCol = award.description || fmtSingleDate(String(award.date ?? ''))
                          return (
                            <li key={award.id} className={`grid grid-cols-[1fr_7rem] sm:grid-cols-[1fr_8.5rem] gap-3 ${BODY_TEXT} py-0.5`}>
                              <span className="text-terminal-text">{award.title}</span>
                              <span className="text-terminal-muted text-right">{dateCol}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <SiteFooter name={person.name} />
    </div>
  )
}
