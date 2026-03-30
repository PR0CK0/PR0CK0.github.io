import { useState, useEffect, useMemo } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Link,
} from '@react-pdf/renderer'
import { loadPortfolioData } from '@/lib/yaml-loader'
import type { Person, Skill } from '@/lib/schema'
import SEO from '@/components/SEO'

// ─── PDF Styles ────────────────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111111',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    lineHeight: 1.4,
  },
  headerSection: {
    marginBottom: 14,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1a3a6b',
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactItem: {
    fontSize: 9,
    color: '#444444',
    marginRight: 12,
  },
  contactLink: {
    fontSize: 9,
    color: '#1a6bbf',
    marginRight: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1a3a6b',
    marginTop: 12,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a6b',
    borderBottomStyle: 'solid',
  },
  summaryText: {
    fontSize: 9.5,
    color: '#222222',
    lineHeight: 1.5,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  entryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#111111',
    flex: 1,
  },
  entryDate: {
    fontSize: 9,
    color: '#555555',
    textAlign: 'right',
  },
  entrySubtitle: {
    fontSize: 9.5,
    color: '#333333',
    marginBottom: 1,
  },
  entryNote: {
    fontSize: 9,
    color: '#444444',
    marginLeft: 8,
  },
  entryBlock: {
    marginBottom: 7,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    marginLeft: 4,
  },
  bullet: {
    fontSize: 9.5,
    color: '#333333',
    marginRight: 4,
    width: 10,
  },
  bulletText: {
    fontSize: 9.5,
    color: '#333333',
    flex: 1,
    lineHeight: 1.4,
  },
  skillCategory: {
    marginBottom: 4,
  },
  skillCategoryLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#1a3a6b',
  },
  skillCategoryItems: {
    fontSize: 9.5,
    color: '#333333',
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  clearanceBox: {
    marginTop: 4,
    padding: 6,
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 3,
    borderLeftColor: '#1a3a6b',
    borderLeftStyle: 'solid',
  },
  clearanceText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a3a6b',
  },
})

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateRange(start?: string, end?: string, isCurrent?: boolean): string {
  const fmt = (d?: string) => {
    if (!d) return ''
    const [year, month] = d.split('-')
    if (!month) return year
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`
  }
  const s = fmt(start)
  const e = isCurrent ? 'Present' : fmt(end)
  if (!s && !e) return ''
  if (!s) return e
  if (!e) return s
  return `${s} – ${e}`
}

// Exclude soft skills from resume — technical focus only
const TECHNICAL_CATEGORIES = new Set([
  'prog_languages', 'data_languages', 'libraries', 'dev_tools', 'office_tools', 'comm_tools', 'cloud', 'vocabularies', 'ai_tools', 'design', 'os',
])

const CATEGORY_LABELS: Record<string, string> = {
  prog_languages: 'Programming Languages',
  data_languages: 'Data Languages',
  libraries: 'Libraries & Frameworks',
  dev_tools: 'Development Tools',
  office_tools: 'Office Tools',
  comm_tools: 'Communication Tools',
  cloud: 'Cloud',
  vocabularies: 'Vocabularies & Standards',
  ai_tools: 'AI Tools',
  design: 'Design',
  os: 'Operating Systems',
}

function groupTechnicalSkills(skills: Skill[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const sk of skills) {
    if (!TECHNICAL_CATEGORIES.has(sk.category)) continue
    const label = CATEGORY_LABELS[sk.category] ?? sk.category
    if (!groups[label]) groups[label] = []
    groups[label].push(sk.name)
  }
  return groups
}

// ─── PDF Document ──────────────────────────────────────────────────────────────

function ResumeDocument({ person }: { person: Person }) {
  const linkedin = person.social_links?.find(s => s.platform === 'LinkedIn')
  const github = person.social_links?.find(s => s.platform === 'GitHub')

  const topProjects = useMemo(() => {
    return [...(person.projects ?? [])]
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return (b.year ?? '').localeCompare(a.year ?? '')
      })
      .slice(0, 8)
  }, [person.projects])

  const skillGroups = useMemo(() => groupTechnicalSkills(person.skills ?? []), [person.skills])

  return (
    <Document title={`${person.name} — Resume`} author={person.name}>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* ── Header ── */}
        <View style={pdfStyles.headerSection}>
          <Text style={pdfStyles.name}>{person.name}</Text>
          {person.title && <Text style={pdfStyles.title}>{person.title}</Text>}
          <View style={pdfStyles.contactRow}>
            {person.email_personal && (
              <Text style={pdfStyles.contactItem}>{person.email_personal}</Text>
            )}
            {person.phone && (
              <Text style={pdfStyles.contactItem}>{person.phone}</Text>
            )}
            {person.location && (
              <Text style={pdfStyles.contactItem}>{person.location} · Remote</Text>
            )}
            {linkedin && (
              <Link src={`https://linkedin.com/in/${linkedin.handle}`} style={pdfStyles.contactLink}>linkedin.com/in/{linkedin.handle}</Link>
            )}
            {github && (
              <Link src={`https://github.com/${github.handle}`} style={pdfStyles.contactLink}>github.com/{github.handle}</Link>
            )}
            {person.website && (
              <Link src={person.website} style={pdfStyles.contactLink}>{person.website.replace('https://', '')}</Link>
            )}
            <Text style={{ ...pdfStyles.contactItem, color: '#888', fontSize: 8 }}>
              Last Updated: {new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* ── Summary ── */}
        {person.summary && (
          <>
            <Text style={pdfStyles.sectionHeader}>Summary</Text>
            <Text style={pdfStyles.summaryText}>{person.summary.trim()}</Text>
          </>
        )}

        {/* ── Work Experience ── */}
        {(person.work_experiences?.length ?? 0) > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Work Experience</Text>
            {person.work_experiences!.map(exp => (
              <View key={exp.id} style={pdfStyles.entryBlock}>
                <View style={pdfStyles.entryRow}>
                  <Text style={pdfStyles.entryTitle}>{exp.title}</Text>
                  <Text style={pdfStyles.entryDate}>{formatDateRange(exp.start_date, exp.end_date, exp.is_current)}</Text>
                </View>
                <Text style={pdfStyles.entrySubtitle}>
                  {exp.organization}{exp.location ? `  |  ${exp.location}` : ''}
                </Text>
                {exp.description?.map((d, i) => (
                  <View key={i} style={pdfStyles.bulletRow}>
                    <Text style={pdfStyles.bullet}>•</Text>
                    <Text style={pdfStyles.bulletText}>{d}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {/* ── Projects ── */}
        {topProjects.length > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Projects</Text>
            {topProjects.map(proj => (
              <View key={proj.id} style={pdfStyles.entryBlock}>
                <View style={pdfStyles.entryRow}>
                  <Text style={pdfStyles.entryTitle}>{proj.title}</Text>
                  {proj.year && <Text style={pdfStyles.entryDate}>{proj.year}</Text>}
                </View>
                {proj.description && (
                  <Text style={pdfStyles.entrySubtitle}>{proj.description}</Text>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <Text style={pdfStyles.entryNote}>Tech: {proj.technologies.join(', ')}</Text>
                )}
                {(proj.url || proj.repo_url) && (
                  <Text style={pdfStyles.entryNote}>{proj.url ?? proj.repo_url}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* ── Technical Skills ── */}
        {Object.keys(skillGroups).length > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Technical Skills</Text>
            {Object.entries(skillGroups).map(([category, items]) => (
              <View key={category} style={pdfStyles.skillCategory}>
                <View style={pdfStyles.skillRow}>
                  <Text style={pdfStyles.skillCategoryLabel}>{category}: </Text>
                  <Text style={pdfStyles.skillCategoryItems}>{items.join(', ')}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Security Clearance ── */}
        {person.clearance && (
          <>
            <Text style={pdfStyles.sectionHeader}>Security Clearance</Text>
            <Text style={{ fontSize: 9.5, color: '#333333' }}>{person.clearance}</Text>
          </>
        )}
      </Page>
    </Document>
  )
}

// ─── HTML Preview Helpers ──────────────────────────────────────────────────────

function PreviewSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '14px',
      fontWeight: 700,
      color: '#1a3a6b',
      borderBottom: '1.5px solid #1a3a6b',
      paddingBottom: '4px',
      marginTop: '20px',
      marginBottom: '10px',
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    }}>
      {children}
    </h2>
  )
}

function PreviewEntryBlock({
  title,
  subtitle,
  date,
  bullets,
  extra,
  inlineSubtitle,
}: {
  title: string
  subtitle?: string
  date?: string
  bullets?: string[]
  extra?: string
  inlineSubtitle?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '10.5px', color: '#111' }}>{title}</span>
          {inlineSubtitle && subtitle && (
            <span style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', marginLeft: '5px' }}>· {subtitle}</span>
          )}
        </div>
        {!inlineSubtitle && subtitle && <div style={{ fontSize: '9.5px', color: '#444', marginTop: '1px' }}>{subtitle}</div>}
        {bullets?.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', marginTop: '2px', marginLeft: '8px' }}>
            <span style={{ color: '#333', fontSize: '9.5px', flexShrink: 0 }}>•</span>
            <span style={{ fontSize: '9.5px', color: '#333', lineHeight: '1.4' }}>{b}</span>
          </div>
        ))}
        {extra && <div style={{ fontSize: '9px', color: '#777', marginLeft: '10px', marginTop: '2px' }}>{extra}</div>}
      </div>
      {date && <span style={{ fontSize: '9.5px', color: '#666', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ResumeExport() {
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPortfolioData()
      .then(data => {
        setPerson(data)
        setLoading(false)
      })
      .catch(err => {
        setError(String(err))
        setLoading(false)
      })
  }, [])

  const pdfDoc = useMemo(() => {
    if (!person) return null
    return <ResumeDocument person={person} />
  }, [person])

  const topProjects = useMemo(() => {
    if (!person) return []
    return [...(person.projects ?? [])]
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return (b.year ?? '').localeCompare(a.year ?? '')
      })
      .slice(0, 8)
  }, [person])

  const skillGroups = useMemo(() => {
    if (!person) return {}
    return groupTechnicalSkills(person.skills ?? [])
  }, [person])

  const linkedin = person?.social_links?.find(s => s.platform === 'LinkedIn')
  const github = person?.social_links?.find(s => s.platform === 'GitHub')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono">
        <span className="text-terminal-amber text-sm animate-pulse">Loading resume data...</span>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono">
        <span className="text-red-400 text-sm">Error loading resume: {error ?? 'Unknown error'}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 font-mono py-10 px-4">
      <SEO
        title="Resume"
        description="Resume of Tyler T. Procko, Ph.D. — work experience, projects, and technical skills in AI, ontology engineering, and knowledge graphs."
        path="/resume"
      />
      {/* ── Page Header ── */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-terminal-amber tracking-tight">
          ~/resume.pdf
        </h1>
        <p className="text-terminal-green text-sm mt-1 opacity-80">
          Work experience, projects, and skills — Generated from YAML source.
        </p>

        <div className="flex gap-3 mt-5">
          {pdfDoc && (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const PdfLink = PDFDownloadLink as any
            return (
              <PdfLink document={pdfDoc} fileName={`tylerprocko_resume_${new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')}.pdf`}>
                {({ loading: pdfLoading }: { loading: boolean }) => (
                  <button
                    className="px-4 py-2 bg-blue-900 border border-blue-500 text-blue-200 text-sm font-mono hover:bg-blue-800 transition-colors rounded"
                    disabled={pdfLoading}
                  >
                    ⬇ Download PDF
                  </button>
                )}
              </PdfLink>
            )
          })()}

          <a href="/cv" className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 text-sm font-mono hover:bg-gray-700 transition-colors rounded inline-block">
            View Full CV
          </a>
        </div>
      </div>

      {/* ── Resume Preview (white paper) ── */}
      <div
        className="max-w-4xl mx-auto"
        style={{
          background: '#ffffff',
          color: '#111111',
          boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
          borderRadius: '2px',
          padding: '48px 56px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '10.5px',
          lineHeight: '1.5',
        }}
      >
        {/* Name & Contact */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a3a6b', margin: 0, letterSpacing: '-0.01em' }}>
            {person.name}
          </h1>
          {person.title && (
            <div style={{ fontSize: '12px', color: '#444', marginTop: '3px', fontStyle: 'italic' }}>
              {person.title}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: '8px', fontSize: '9.5px', color: '#555' }}>
            {person.email_personal && <span>{person.email_personal}</span>}
            {person.phone && <span>{person.phone}</span>}
            {person.location && <span>{person.location} · Remote</span>}
            {linkedin && <a href={`https://linkedin.com/in/${linkedin.handle}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1a6bbf', textDecoration: 'none' }}>linkedin.com/in/{linkedin.handle}</a>}
            {github && <a href={`https://github.com/${github.handle}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1a6bbf', textDecoration: 'none' }}>github.com/{github.handle}</a>}
            {person.website && <a href={person.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1a6bbf', textDecoration: 'none' }}>{person.website.replace('https://', '')}</a>}
            <span style={{ color: '#888', fontSize: '8.5px' }}>Last Updated: {new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Summary */}
        {person.summary && (
          <>
            <PreviewSectionHeader>Summary</PreviewSectionHeader>
            <p style={{ fontSize: '9.5px', color: '#222', lineHeight: '1.6', margin: 0 }}>
              {person.summary.trim()}
            </p>
          </>
        )}

        {/* Work Experience */}
        {(person.work_experiences?.length ?? 0) > 0 && (
          <>
            <PreviewSectionHeader>Work Experience</PreviewSectionHeader>
            {person.work_experiences!.map(exp => (
              <PreviewEntryBlock
                key={exp.id}
                title={exp.title}
                subtitle={`${exp.organization}${exp.location ? `  ·  ${exp.location}` : ''}`}
                date={formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                bullets={exp.description}
                inlineSubtitle
              />
            ))}
          </>
        )}

        {/* Projects */}
        {topProjects.length > 0 && (
          <>
            <PreviewSectionHeader>Projects</PreviewSectionHeader>
            {topProjects.map(proj => (
              <PreviewEntryBlock
                key={proj.id}
                title={proj.title}
                subtitle={proj.description}
                date={proj.year}
                extra={[
                  proj.technologies?.length ? `Tech: ${proj.technologies.join(', ')}` : '',
                  proj.url ?? proj.repo_url ?? '',
                ].filter(Boolean).join('  |  ')}
              />
            ))}
          </>
        )}

        {/* Technical Skills */}
        {Object.keys(skillGroups).length > 0 && (
          <>
            <PreviewSectionHeader>Technical Skills</PreviewSectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
              {Object.entries(skillGroups).map(([category, items]) => (
                <div key={category} style={{ fontSize: '9.5px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 700, color: '#1a3a6b' }}>{category}: </span>
                  <span style={{ color: '#333' }}>{items.join(', ')}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Security Clearance */}
        {person.clearance && (
          <>
            <PreviewSectionHeader>Security Clearance</PreviewSectionHeader>
            <p style={{ fontSize: '9.5px', color: '#333', margin: 0 }}>{person.clearance}</p>
          </>
        )}
      </div>
    </div>
  )
}
