import { useState, useEffect } from 'react'
import { loadPortfolioData } from '@/lib/yaml-loader'
import type { Person } from '@/lib/schema'
import SEO from '@/components/SEO'

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
      <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
        <span className="font-mono text-terminal-green text-sm animate-pulse">loading...</span>
      </div>
    )
  }

  if (!person) return null

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <h1 className="text-xl sm:text-2xl font-bold text-terminal-green tracking-tight mb-1">
          ~/about
        </h1>
        <p className="text-terminal-muted text-xs sm:text-sm mb-8">
          The person behind the terminal.
        </p>

        <div className="space-y-6">
          {sections.map(({ label, value }) => (
            <div key={label} className="border-b border-terminal-border/30 pb-4">
              <h2 className="text-terminal-amber text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                {label}
              </h2>
              {Array.isArray(value) ? (
                <p className="text-terminal-text text-sm sm:text-base leading-relaxed">
                  {value.join(', ')}
                </p>
              ) : (
                <p className="text-terminal-text text-sm sm:text-base leading-relaxed">
                  {value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
