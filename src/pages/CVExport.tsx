import { useState, useEffect, useMemo } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  PDFViewer,
  Link,
  Font,
  Image,
} from '@react-pdf/renderer'
import { loadPortfolioData } from '@/lib/yaml-loader'
import type { Person, Skill } from '@/lib/schema'
import SEO from '@/components/SEO'
import erauLogo from '@/assets/erau-logo.png'

// ─── Custom Fonts (Caladea ≈ Cambria, Carlito ≈ Calibri) ────────────────────
import CaladeaRegular from '@/fonts/caladea/Caladea-Regular.ttf'
import CaladeaBold from '@/fonts/caladea/Caladea-Bold.ttf'
import CaladeaItalic from '@/fonts/caladea/Caladea-Italic.ttf'
import CaladeaBoldItalic from '@/fonts/caladea/Caladea-BoldItalic.ttf'
import CarlitoBold from '@/fonts/carlito/Carlito-Bold.ttf'

Font.register({
  family: 'Caladea',
  fonts: [
    { src: CaladeaRegular, fontWeight: 'normal', fontStyle: 'normal' },
    { src: CaladeaBold, fontWeight: 'bold', fontStyle: 'normal' },
    { src: CaladeaItalic, fontWeight: 'normal', fontStyle: 'italic' },
    { src: CaladeaBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

Font.register({
  family: 'Carlito',
  fonts: [
    { src: CarlitoBold, fontWeight: 'bold' },
  ],
})

/** Format GPA: 4 → "4.0", 3.93 → "3.93", 3 → "3.0" */
function fmtGpa(n: number): string {
  return Number.isInteger(n) ? n.toFixed(1) : String(n)
}

// ─── PDF Styles ────────────────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Caladea',
    fontSize: 10,
    color: '#111111',
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 44,
    lineHeight: 1.4,
  },
  // Header
  headerSection: {
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Carlito',
    fontWeight: 'bold',
    color: '#2E74B5',
    marginBottom: 1,
  },
  title: {
    fontSize: 10,
    color: '#444444',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 1,
  },
  contactItem: {
    fontSize: 8.5,
    color: '#444444',
  },
  contactLink: {
    fontSize: 8.5,
    color: '#2E74B5',
  },
  contactSep: {
    fontSize: 8.5,
    color: '#999999',
  },
  // Section headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E74B5',
    marginTop: 8,
    marginBottom: 3,
    paddingBottom: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: '#2E74B5',
    borderBottomStyle: 'solid',
  },
  // Summary
  summaryText: {
    fontSize: 8.5,
    color: '#222222',
    lineHeight: 1.5,
  },
  // Education
  entryRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  entryContent: {
    flex: 83,
    paddingRight: 6,
  },
  entryDateCol: {
    flex: 17,
    alignItems: 'flex-end',
  },
  entryTitle: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#111111',
  },
  entryDate: {
    fontSize: 8,
    color: '#555555',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  entrySubtitle: {
    fontSize: 8.5,
    color: '#333333',
    marginBottom: 1,
  },
  entryNote: {
    fontSize: 8,
    color: '#444444',
    marginLeft: 8,
  },
  entryBlock: {
    marginBottom: 5,
  },
  // Bullets
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
    marginLeft: 4,
  },
  bullet: {
    fontSize: 8.5,
    color: '#333333',
    marginRight: 4,
    width: 8,
  },
  bulletText: {
    fontSize: 8.5,
    color: '#333333',
    flex: 1,
    lineHeight: 1.4,
  },
  // Skills
  skillCategory: {
    marginBottom: 4,
  },
  skillCategoryLabel: {
    fontWeight: 'bold',
    fontSize: 8.5,
    color: '#2E74B5',
  },
  skillCategoryItems: {
    fontSize: 8.5,
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
        <View style={{ ...pdfStyles.headerSection, flexDirection: 'row', justifyContent: 'space-between' }}>
          {/* Left: text */}
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.name}>{person.name}</Text>
            {person.title && <Text style={pdfStyles.title}>{person.title.replace(/·/g, '\u00A0·\u00A0')}</Text>}
            {/* Line 1: location | phone */}
            <Text style={pdfStyles.contactItem}>
              {[person.location && `${person.location} · Remote`, person.phone].filter(Boolean).join('  |  ')}
            </Text>
            {/* Line 2: emails */}
            <Text style={pdfStyles.contactItem}>
              {[person.email_personal, person.email_academic].filter(Boolean).join('  |  ')}
            </Text>
            {/* Line 3: links (clickable) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 1 }}>
              {linkedin && (
                <><Link src={`https://linkedin.com/in/${linkedin.handle}`} style={pdfStyles.contactLink}>LinkedIn</Link><Text style={pdfStyles.contactSep}>{'\u00A0\u00A0|\u00A0\u00A0'}</Text></>
              )}
              {github && (
                <><Link src={`https://github.com/${github.handle}`} style={pdfStyles.contactLink}>GitHub</Link><Text style={pdfStyles.contactSep}>{'\u00A0\u00A0|\u00A0\u00A0'}</Text></>
              )}
              {person.website && (
                <><Link src={person.website} style={pdfStyles.contactLink}>{person.website.replace('https://', '')}</Link><Text style={pdfStyles.contactSep}>{'\u00A0\u00A0|\u00A0\u00A0'}</Text></>
              )}
              {person.orcid && (
                <Link src={`https://orcid.org/${person.orcid}`} style={pdfStyles.contactLink}>ORCID</Link>
              )}
            </View>
            {/* Line 4: last updated */}
            <Text style={{ fontSize: 7.5, color: '#999', marginTop: 2 }}>
              Last Updated: {new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          {/* Right: ERAU logo */}
          <Image src={erauLogo} style={{ width: 70, height: 70, objectFit: 'contain' }} />
        </View>

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
              <View key={edu.id} style={{ ...pdfStyles.entryBlock, ...pdfStyles.entryRow }}>
                <View style={pdfStyles.entryContent}>
                  <Text style={pdfStyles.entryTitle}>{edu.degree}{edu.field && edu.field !== edu.degree ? ` in ${edu.field}` : ''}</Text>
                  <Text style={pdfStyles.entrySubtitle}>
                    <Text style={{ fontStyle: 'italic' }}>{edu.institution}</Text>
                    {edu.gpa ? `  |  GPA: ${fmtGpa(edu.gpa)}/${fmtGpa(edu.gpa_max ?? 4.0)}` : ''}
                  </Text>
                  {edu.thesis_title && (
                    <Text style={pdfStyles.entryNote}>• {edu.thesis_label ?? 'Thesis'}:{' '}
                      {edu.thesis_url ? (
                        <Link src={edu.thesis_url} style={{ color: '#1a6bbf', textDecoration: 'none' }}>{edu.thesis_title}</Link>
                      ) : edu.thesis_title}
                    </Text>
                  )}
                  {edu.thesis_github && (
                    <Text style={pdfStyles.entryNote}>• GitHub:{' '}
                      <Link src={edu.thesis_github} style={{ color: '#1a6bbf', textDecoration: 'none' }}>{edu.thesis_github}</Link>
                    </Text>
                  )}
                  {edu.advisor && (
                    <Text style={pdfStyles.entryNote}>• Advisor:{' '}
                      {edu.advisor_url ? (
                        <Link src={edu.advisor_url} style={{ color: '#1a6bbf', textDecoration: 'none' }}>{edu.advisor}</Link>
                      ) : edu.advisor}
                    </Text>
                  )}
                  {edu.notes?.map((note, i) => (
                    <Text key={i} style={pdfStyles.entryNote}>• {note}</Text>
                  ))}
                </View>
                <View style={pdfStyles.entryDateCol}>
                  <Text style={pdfStyles.entryDate}>{formatDateRange(edu.start_date, edu.end_date)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Work Experience ── */}
        {(person.work_experiences?.length ?? 0) > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Work Experience</Text>
            {person.work_experiences!.map(exp => (
              <View key={exp.id} style={{ ...pdfStyles.entryBlock, ...pdfStyles.entryRow }}>
                <View style={pdfStyles.entryContent}>
                  <Text style={pdfStyles.entryTitle}>
                    {exp.title}
                    <Text style={{ fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>
                      {' – '}{exp.organization}{exp.location ? `, ${exp.location}` : ''}
                    </Text>
                  </Text>
                  {exp.description?.map((d, i) => (
                    <View key={i} style={pdfStyles.bulletRow}>
                      <Text style={pdfStyles.bullet}>•</Text>
                      <Text style={pdfStyles.bulletText}>{d}</Text>
                    </View>
                  ))}
                </View>
                <View style={pdfStyles.entryDateCol}>
                  <Text style={pdfStyles.entryDate}>{formatDateRange(exp.start_date, exp.end_date, exp.is_current)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Publications ── */}
        {topPubs.length > 0 && (
          <>
            <Text style={pdfStyles.sectionHeader}>Selected Publications (Top 10, Published)</Text>
            {topPubs.map((pub, i) => (
              <View key={pub.id} style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#111', marginBottom: 2 }}>[{i + 1}] {pub.title}</Text>
                <Text style={{ fontSize: 8.5, color: '#333', marginBottom: 1 }}>
                  {pub.authors?.join(', ')}{pub.venue ? `. ${pub.venue}` : ''}{pub.date ? `. ${pub.date}` : ''}
                </Text>
                {pub.url && (
                  <Link src={pub.url} style={{ fontSize: 8, color: '#1a6bbf', textDecoration: 'none' }}>{pub.url}</Link>
                )}
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
                  <View style={pdfStyles.entryContent}>
                    <Text style={pdfStyles.entryTitle}>{proj.title}</Text>
                    {proj.description && (
                      <Text style={pdfStyles.entrySubtitle}>{proj.description}</Text>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <Text style={pdfStyles.entryNote}>Tech: {proj.technologies.join(', ')}</Text>
                    )}
                    {(proj.url || proj.repo_url) && (
                      <Text style={pdfStyles.entryNote}>
                        <Link src={proj.url ?? proj.repo_url ?? ''} style={{ color: '#1a6bbf', textDecoration: 'none' }}>{proj.url ?? proj.repo_url}</Link>
                      </Text>
                    )}
                  </View>
                  <View style={pdfStyles.entryDateCol}>
                    {proj.year && <Text style={pdfStyles.entryDate}>{proj.year}</Text>}
                  </View>
                </View>
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
  notes,
  bullets,
  extra,
  inlineSubtitle,
}: {
  title: string
  subtitle?: React.ReactNode
  date?: string
  notes?: string[]
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
      {date && <span style={{ fontSize: '9.5px', color: '#666', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>}
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
      <SEO
        title="CV / Curriculum Vitae"
        description="Full academic and professional CV of Tyler T. Procko, Ph.D. — publications, work experience, education, and skills."
        path="/cv"
      />
      {/* ── Page Header ── */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-terminal-amber tracking-tight">
          ~/cv.pdf
        </h1>
        <p className="text-terminal-green text-sm mt-1 opacity-80">
          Full academic and professional record — Generated from YAML source.
        </p>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 mt-5">
          {pdfDoc && (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const PdfLink = PDFDownloadLink as any
            return (
              <PdfLink document={pdfDoc} fileName={`tylerprocko_cv_${new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')}.pdf`}>
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

      {/* ── PDF Preview ── */}
      {pdfDoc && (
        <div className="max-w-4xl mx-auto" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(() => {
            const Viewer = PDFViewer as any
            return (
              <Viewer width="100%" height="100%" style={{ border: 'none', borderRadius: '2px' }}>
                {pdfDoc}
              </Viewer>
            )
          })()}
        </div>
      )}
    </div>
  )
}

/* HTML preview removed — PDFViewer is now the canonical preview */
