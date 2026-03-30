import { useState, useEffect, useMemo } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { loadPortfolioData } from '@/lib/yaml-loader'
import type { Person, Skill } from '@/lib/schema'

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
  // Header
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
  // Section headers
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
  // Summary
  summaryText: {
    fontSize: 9.5,
    color: '#222222',
    lineHeight: 1.5,
  },
  // Education
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
  // Bullets
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
  // Skills
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
  // Clearance box
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

function groupSkills(skills: Skill[]): Record<string, string[]> {
  const labelMap: Record<string, string> = {
    languages: 'Languages',
    libraries: 'Libraries & Frameworks',
    tools: 'Tools',
    cloud: 'Cloud',
    vocabularies: 'Vocabularies & Standards',
    ai_tools: 'AI Tools',
    design: 'Design',
    os: 'Operating Systems',
    soft_skills: 'Soft Skills',
  }
  const groups: Record<string, string[]> = {}
  for (const sk of skills) {
    const label = labelMap[sk.category] ?? sk.category
    if (!groups[label]) groups[label] = []
    groups[label].push(sk.name)
  }
  return groups
}

// ─── PDF Document ──────────────────────────────────────────────────────────────

function CVDocument({ person }: { person: Person }) {
  const linkedin = person.social_links?.find(s => s.platform === 'LinkedIn')
  const github = person.social_links?.find(s => s.platform === 'GitHub')

  // Top 10 published publications, sorted by date descending
  const topPubs = useMemo(() => {
    return [...(person.publications ?? [])]
      .filter(p => p.status === 'published')
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      .slice(0, 10)
  }, [person.publications])

  // Top 8 featured / most recent projects
  const topProjects = useMemo(() => {
    return [...(person.projects ?? [])]
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return (b.year ?? '').localeCompare(a.year ?? '')
      })
      .slice(0, 8)
  }, [person.projects])

  const skillGroups = useMemo(() => groupSkills(person.skills ?? []), [person.skills])

  return (
    <Document title={`${person.name} — CV`} author={person.name}>
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
            {linkedin && (
              <Text style={pdfStyles.contactItem}>linkedin.com/in/{linkedin.handle}</Text>
            )}
            {github && (
              <Text style={pdfStyles.contactItem}>github.com/{github.handle}</Text>
            )}
            {person.orcid && (
              <Text style={pdfStyles.contactItem}>ORCiD: {person.orcid}</Text>
            )}
            {person.website && (
              <Text style={pdfStyles.contactItem}>{person.website}</Text>
            )}
          </View>
        </View>

        {/* ── Clearance ── */}
        {person.clearance && (
          <View style={pdfStyles.clearanceBox}>
            <Text style={pdfStyles.clearanceText}>Security Clearance: {person.clearance}</Text>
          </View>
        )}

        {/* ── Summary ── */}
        {person.summary && (
          <>
            <Text style={pdfStyles.sectionHeader}>Summary</Text>
            <Text style={pdfStyles.summaryText}>{person.summary.trim()}</Text>
          </>
        )}

        {/* ── Education ── */}
        {(person.education?.length ?? 0) > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Education</Text>
            {person.education!.map(edu => (
              <View key={edu.id} style={pdfStyles.entryBlock}>
                <View style={pdfStyles.entryRow}>
                  <Text style={pdfStyles.entryTitle}>{edu.degree}{edu.field && edu.field !== edu.degree ? ` in ${edu.field}` : ''}</Text>
                  <Text style={pdfStyles.entryDate}>{formatDateRange(edu.start_date, edu.end_date)}</Text>
                </View>
                <Text style={pdfStyles.entrySubtitle}>{edu.institution}{edu.gpa ? `  |  GPA: ${edu.gpa}` : ''}</Text>
                {edu.notes?.map((note, i) => (
                  <Text key={i} style={pdfStyles.entryNote}>• {note}</Text>
                ))}
              </View>
            ))}
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

        {/* ── Publications ── */}
        {topPubs.length > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Selected Publications (Top 10, Published)</Text>
            {topPubs.map((pub, i) => (
              <View key={pub.id} style={pdfStyles.entryBlock}>
                <Text style={pdfStyles.entryTitle}>[{i + 1}] {pub.title}</Text>
                <Text style={pdfStyles.entrySubtitle}>
                  {pub.authors?.join(', ')}{pub.venue ? `. ${pub.venue}` : ''}{pub.date ? `. ${pub.date}` : ''}
                </Text>
                {pub.url && <Text style={pdfStyles.entryNote}>{pub.url}</Text>}
              </View>
            ))}
          </>
        )}

        {/* ── Projects ── */}
        {topProjects.length > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Projects (Top 8)</Text>
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

        {/* ── Skills ── */}
        {Object.keys(skillGroups).length > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Skills</Text>
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

        {/* ── Awards ── */}
        {(person.awards?.length ?? 0) > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Awards & Honors</Text>
            {person.awards!.map(award => (
              <View key={award.id} style={pdfStyles.bulletRow}>
                <Text style={pdfStyles.bullet}>•</Text>
                <Text style={pdfStyles.bulletText}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>{award.title}</Text>
                  {award.issuer ? ` — ${award.issuer}` : ''}
                  {award.date ? ` (${award.date})` : ''}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* ── Certifications ── */}
        {(person.certificates?.length ?? 0) > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Certifications</Text>
            {person.certificates!.map(cert => (
              <View key={cert.id} style={pdfStyles.bulletRow}>
                <Text style={pdfStyles.bullet}>•</Text>
                <Text style={pdfStyles.bulletText}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>{cert.title}</Text>
                  {cert.issuer ? ` — ${cert.issuer}` : ''}
                  {cert.date ? ` (${cert.date})` : ''}
                  {cert.status === 'in_progress' ? ' [In Progress]' : ''}
                </Text>
              </View>
            ))}
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
  notes,
  bullets,
  extra,
  inlineSubtitle,
}: {
  title: string
  subtitle?: string
  date?: string
  notes?: string[]
  bullets?: string[]
  extra?: string
  inlineSubtitle?: boolean
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
        <span>
          <span style={{ fontWeight: 700, fontSize: '10.5px', color: '#111' }}>{title}</span>
          {inlineSubtitle && subtitle && (
            <span style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', marginLeft: '5px' }}>· {subtitle}</span>
          )}
        </span>
        {date && <span style={{ fontSize: '9.5px', color: '#666', whiteSpace: 'nowrap' }}>{date}</span>}
      </div>
      {!inlineSubtitle && subtitle && <div style={{ fontSize: '9.5px', color: '#444', marginTop: '1px' }}>{subtitle}</div>}
      {notes?.map((note, i) => (
        <div key={i} style={{ fontSize: '9px', color: '#555', marginLeft: '10px', marginTop: '1px' }}>• {note}</div>
      ))}
      {bullets?.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', marginTop: '2px', marginLeft: '8px' }}>
          <span style={{ color: '#333', fontSize: '9.5px', flexShrink: 0 }}>•</span>
          <span style={{ fontSize: '9.5px', color: '#333', lineHeight: '1.4' }}>{b}</span>
        </div>
      ))}
      {extra && <div style={{ fontSize: '9px', color: '#777', marginLeft: '10px', marginTop: '2px' }}>{extra}</div>}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CVExport() {
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
    return <CVDocument person={person} />
  }, [person])

  const topPubs = useMemo(() => {
    if (!person) return []
    return [...(person.publications ?? [])]
      .filter(p => p.status === 'published')
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      .slice(0, 10)
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
    return groupSkills(person.skills ?? [])
  }, [person])

  const linkedin = person?.social_links?.find(s => s.platform === 'LinkedIn')
  const github = person?.social_links?.find(s => s.platform === 'GitHub')

  // ── Loading / Error States
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono">
        <span className="text-terminal-amber text-sm animate-pulse">Loading CV data...</span>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono">
        <span className="text-red-400 text-sm">Error loading CV: {error ?? 'Unknown error'}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 font-mono py-10 px-4">
      {/* ── Page Header ── */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-terminal-amber tracking-tight">
          ~/cv.pdf
        </h1>
        <p className="text-terminal-green text-sm mt-1 opacity-80">
          Generated from LinkML YAML source
        </p>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 mt-5">
          {pdfDoc && (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const PdfLink = PDFDownloadLink as any
            return (
              <PdfLink document={pdfDoc} fileName="tyler-procko-cv.pdf">
                {({ loading: pdfLoading }: { loading: boolean }) => (
                  <button
                    className="px-4 py-2 bg-blue-900 border border-blue-500 text-blue-200 text-sm font-mono hover:bg-blue-800 transition-colors rounded"
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? '⏳ Preparing...' : '⬇ Download PDF'}
                  </button>
                )}
              </PdfLink>
            )
          })()}

          <a
            href="/data/tyler-procko.yaml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 text-sm font-mono hover:bg-gray-700 transition-colors rounded">
              {'<>'} View Raw YAML
            </button>
          </a>
        </div>
      </div>

      {/* ── CV Preview (white paper) ── */}
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
        {/* Name & Contact Header */}
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
            {linkedin && <span>linkedin.com/in/{linkedin.handle}</span>}
            {github && <span>github.com/{github.handle}</span>}
            {person.orcid && <span>ORCiD: {person.orcid}</span>}
            {person.website && <span>{person.website}</span>}
          </div>
        </div>

        {/* Clearance Banner */}
        {person.clearance && (
          <div style={{
            background: '#f0f4ff',
            borderLeft: '3px solid #1a3a6b',
            padding: '6px 12px',
            marginBottom: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#1a3a6b',
            fontFamily: 'sans-serif',
          }}>
            Security Clearance: {person.clearance}
          </div>
        )}

        {/* Summary */}
        {person.summary && (
          <>
            <PreviewSectionHeader>Summary</PreviewSectionHeader>
            <p style={{ fontSize: '9.5px', color: '#222', lineHeight: '1.6', margin: 0 }}>
              {person.summary.trim()}
            </p>
          </>
        )}

        {/* Education */}
        {(person.education?.length ?? 0) > 0 && (
          <>
            <PreviewSectionHeader>Education</PreviewSectionHeader>
            {person.education!.map(edu => (
              <PreviewEntryBlock
                key={edu.id}
                title={`${edu.degree}${edu.field && edu.field !== edu.degree ? ` in ${edu.field}` : ''}`}
                subtitle={`${edu.institution}${edu.gpa ? `  |  GPA: ${edu.gpa}` : ''}`}
                date={formatDateRange(edu.start_date, edu.end_date)}
                notes={edu.notes}
              />
            ))}
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

        {/* Publications */}
        {topPubs.length > 0 && (
          <>
            <PreviewSectionHeader>Selected Publications (Top 10, Published)</PreviewSectionHeader>
            {topPubs.map((pub, i) => (
              <div key={pub.id} style={{ marginBottom: '9px' }}>
                <span style={{ fontWeight: 700, fontSize: '10px', color: '#111' }}>
                  [{i + 1}] {pub.title}
                </span>
                <div style={{ fontSize: '9px', color: '#444', marginTop: '2px' }}>
                  {pub.authors?.join(', ')}
                  {pub.venue ? `. ${pub.venue}` : ''}
                  {pub.date ? `. ${pub.date}` : ''}
                </div>
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '8.5px', color: '#1a3a6b', display: 'block', marginTop: '1px' }}
                  >
                    {pub.url}
                  </a>
                )}
              </div>
            ))}
          </>
        )}

        {/* Projects */}
        {topProjects.length > 0 && (
          <>
            <PreviewSectionHeader>Projects (Top 8)</PreviewSectionHeader>
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

        {/* Skills */}
        {Object.keys(skillGroups).length > 0 && (
          <>
            <PreviewSectionHeader>Skills</PreviewSectionHeader>
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

        {/* Awards */}
        {(person.awards?.length ?? 0) > 0 && (
          <>
            <PreviewSectionHeader>Awards & Honors</PreviewSectionHeader>
            {person.awards!.map(award => (
              <div key={award.id} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: '#333', fontSize: '9.5px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '9.5px', color: '#333' }}>
                  <strong>{award.title}</strong>
                  {award.issuer ? ` — ${award.issuer}` : ''}
                  {award.date ? ` (${award.date})` : ''}
                  {award.description ? <span style={{ color: '#666' }}> — {award.description}</span> : null}
                </span>
              </div>
            ))}
          </>
        )}

        {/* Certifications */}
        {(person.certificates?.length ?? 0) > 0 && (
          <>
            <PreviewSectionHeader>Certifications</PreviewSectionHeader>
            {person.certificates!.map(cert => (
              <div key={cert.id} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: '#333', fontSize: '9.5px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '9.5px', color: '#333' }}>
                  <strong>{cert.title}</strong>
                  {cert.issuer ? ` — ${cert.issuer}` : ''}
                  {cert.date ? ` (${cert.date})` : ''}
                  {cert.status === 'in_progress' ? <em style={{ color: '#888' }}> [In Progress]</em> : ''}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
