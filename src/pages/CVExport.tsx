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
import type { Person } from '@/lib/schema'
import SEO from '@/components/SEO'
import SiteFooter from '@/components/SiteFooter'
import { buildCVData, type CVData, type CVSection, type CVEntry, type CVHeaderData } from '@/lib/cv-data'
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

// ─── PDF Styles ────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: { fontFamily: 'Caladea', fontSize: 10, color: '#111', paddingTop: 36, paddingBottom: 36, paddingHorizontal: 44, lineHeight: 1.4, textAlign: 'justify' as const },
  name: { fontSize: 22, fontFamily: 'Caladea', fontWeight: 'bold', color: '#1a3a6b', marginBottom: 1 },
  title: { fontSize: 10, color: '#444', fontStyle: 'italic', marginBottom: 4 },
  contactLine: { fontSize: 8.5, color: '#444' },
  contactLink: { fontSize: 8.5, color: '#1a3a6b' },
  contactSep: { fontSize: 8.5, color: '#999' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', color: '#1a3a6b', marginTop: 8, marginBottom: 3, paddingBottom: 1, borderBottomWidth: 0.75, borderBottomColor: '#1a3a6b', borderBottomStyle: 'solid' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  subsectionHeader: { fontSize: 10.5, fontWeight: 'bold', color: '#1a3a6b', marginTop: 5, marginBottom: 2, textDecoration: 'underline' },
  subsectionDesc: { fontSize: 8, color: '#555', fontStyle: 'italic', marginBottom: 3, lineHeight: 1.4 },
  row: { flexDirection: 'row' as const, marginBottom: 5 },
  contentCol: { flex: 86, paddingRight: 6 },
  dateCol: { flex: 14, alignItems: 'flex-end' as const },
  entryTitle: { fontWeight: 'bold', fontSize: 9, color: '#111' },
  titleSuffix: { fontWeight: 'normal', fontStyle: 'italic', color: '#3d6ba8', fontSize: 9 },
  date: { fontSize: 8, color: '#555', fontStyle: 'italic', textAlign: 'right' as const },
  subtitle: { fontSize: 8.5, color: '#333', marginBottom: 1 },
  note: { fontSize: 8, color: '#444', marginLeft: 8 },
  bulletRow: { flexDirection: 'row' as const, marginBottom: 1.5, marginLeft: 4 },
  bulletDot: { fontSize: 8.5, color: '#333', marginRight: 4, width: 8 },
  bulletText: { fontSize: 8.5, color: '#333', flex: 1, lineHeight: 1.4 },
  pubTitle: { fontWeight: 'bold', fontSize: 9, color: '#111', marginBottom: 2 },
  pubMeta: { fontSize: 8, color: '#333', marginBottom: 1 },
  pubBlock: { marginBottom: 6 },
  skillLabel: { fontWeight: 'bold', fontSize: 8.5, color: '#1a3a6b' },
  skillItems: { fontSize: 8.5, color: '#333' },
  skillRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 2 },
  summaryText: { fontSize: 8.5, color: '#222', lineHeight: 1.5 },
  lastUpdated: { fontSize: 7.5, color: '#999', marginTop: 2 },
  refGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
  refCard: { flex: 1, minWidth: 160 },
  refName: { fontWeight: 'bold', fontSize: 9, color: '#111', textDecoration: 'underline' },
  refDetail: { fontSize: 8.5, color: '#333' },
  refEmail: { fontSize: 8, color: '#1a6bbf' },
})

const NBS = '\u00A0' // non-breaking space

// ─── PDF Document ──────────────────────────────────────────────────────────────

function CVPdfDocument({ data }: { data: CVData }) {
  const h = data.header
  return (
    <Document title={`${h.name} — CV`} author={h.name}>
      <Page size="LETTER" style={S.page}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={S.name}>{h.name}</Text>
            {h.title && <Text style={S.title}>{h.title}</Text>}
            {h.contactLines.map((line, i) => (
              <Text key={i} style={S.contactLine}>{line}</Text>
            ))}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 1 }}>
              {h.links.map((link, i) => (
                <View key={i} style={{ flexDirection: 'row' }}>
                  <Link src={link.url} style={S.contactLink}>{link.label}</Link>
                  {i < h.links.length - 1 && <Text style={S.contactSep}>{`${NBS}${NBS}|${NBS}${NBS}`}</Text>}
                </View>
              ))}
            </View>
            <Text style={S.lastUpdated}>
              {h.lastUpdated}{' – '}
              <Link src={h.sourceUrl} style={{ color: '#1a6bbf', textDecoration: 'none', fontSize: 7.5 }}>View live version</Link>
            </Text>
          </View>
          <Image src={erauLogo} style={{ width: 70, height: 70, objectFit: 'contain' }} />
        </View>

        {/* Sections */}
        {data.sections.map((sec, si) => (
          <View key={si}>
            <Text style={S.sectionHeader}>{sec.header}</Text>
            {/* Simple text */}
            {sec.text && <Text style={S.summaryText}>{sec.text}</Text>}
            {/* Entries (education, work, projects, awards, certs, clearance) */}
            {sec.entries?.map((entry, ei) => (
              <View key={ei} style={S.row}>
                <View style={S.contentCol}>
                  <Text style={S.entryTitle}>
                    {entry.titleUrl ? <Link src={entry.titleUrl} style={{ color: '#111', textDecoration: 'none' }}>{entry.title}</Link> : entry.title}
                    {entry.titleSuffix && <Text style={S.titleSuffix}>{` – ${entry.titleSuffix}`}</Text>}
                  </Text>
                  {entry.subtitle && (
                    <Text style={S.subtitle}>
                      <Text style={{ fontStyle: 'italic' }}>{entry.subtitle}</Text>
                      {entry.gpa && <>{'  |  GPA: '}<Text style={{ fontWeight: 'bold' }}>{entry.gpa.value}</Text>{'/' + entry.gpa.max}</>}
                    </Text>
                  )}
                  {entry.notes?.map((note, ni) => (
                    <Text key={ni} style={S.note}>
                      {'• '}
                      {note.prefix}{note.url ? (
                        <Link src={note.url} style={{ color: '#1a6bbf', textDecoration: 'none' }}>{note.text}</Link>
                      ) : note.text}
                    </Text>
                  ))}
                  {entry.bullets?.map((b, bi) => (
                    <View key={bi} style={S.bulletRow}>
                      <Text style={S.bulletDot}>•</Text>
                      <Text style={S.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
                <View style={S.dateCol}>
                  {entry.date && <Text style={S.date}>{entry.date}</Text>}
                </View>
              </View>
            ))}
            {/* Subsections (e.g., work experience grouped by category) */}
            {sec.subsections?.map((sub, ssi) => (
              <View key={ssi}>
                <Text style={S.subsectionHeader}>{sub.subheader}</Text>
                {sub.description && <Text style={S.subsectionDesc}>{sub.description}</Text>}
                {sub.entries.map((entry, ei) => (
                  <View key={ei} style={S.row}>
                    <View style={S.contentCol}>
                      <Text style={S.entryTitle}>
                        {entry.titleUrl ? <Link src={entry.titleUrl} style={{ color: '#111', textDecoration: 'none' }}>{entry.title}</Link> : entry.title}
                        {entry.titleSuffix && <Text style={S.titleSuffix}>{` – ${entry.titleSuffix}`}</Text>}
                      </Text>
                      {entry.subtitle && (
                        <Text style={S.subtitle}>
                          <Text style={{ fontStyle: 'italic' }}>{entry.subtitle}</Text>
                          {entry.gpa && <>{'  |  GPA: '}<Text style={{ fontWeight: 'bold' }}>{entry.gpa.value}</Text>{'/' + entry.gpa.max}</>}
                        </Text>
                      )}
                      {entry.notes?.map((note, ni) => (
                        <Text key={ni} style={S.note}>
                          {'• '}
                          {note.prefix}{note.url ? <Link src={note.url} style={{ color: '#1a6bbf', textDecoration: 'none' }}>{note.text}</Link> : note.text}
                        </Text>
                      ))}
                      {entry.bullets?.map((b, bi) => (
                        <View key={bi} style={S.bulletRow}>
                          <Text style={S.bulletDot}>•</Text>
                          <Text style={S.bulletText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={S.dateCol}>
                      {entry.date && <Text style={S.date}>{entry.date}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ))}
            {/* Publications */}
            {sec.publications?.map((pub) => (
              <View key={pub.index} style={S.pubBlock}>
                <Text style={S.pubTitle}>[{pub.index}] {pub.title}</Text>
                <Text style={S.pubMeta}>{pub.authors}{pub.venue ? `. ${pub.venue}` : ''}{pub.date ? `. ${pub.date}` : ''}</Text>
                {pub.url && <Link src={pub.url} style={{ fontSize: 7.5, color: '#1a6bbf', textDecoration: 'none' }}>{pub.url}</Link>}
              </View>
            ))}
            {/* Skills */}
            {sec.skillGroups && Object.entries(sec.skillGroups).map(([cat, items]) => (
              <View key={cat} style={S.skillRow}>
                <Text style={S.skillLabel}>{cat}: </Text>
                <Text style={S.skillItems}>{items.join(', ')}</Text>
              </View>
            ))}
            {/* References */}
            {sec.references && (
              <View style={S.refGrid}>
                {sec.references.map((ref, ri) => (
                  <View key={ri} style={S.refCard}>
                    <Text style={S.refName}>{ref.name}</Text>
                    {(ref.title || ref.organization) && (
                      <Text style={S.refDetail}>
                        {'• '}{[ref.title, ref.organization].filter(Boolean).join(', ')}
                      </Text>
                    )}
                    {ref.email && (
                      <Link src={`mailto:${ref.email}`} style={S.refEmail}>{'• '}{ref.email}</Link>
                    )}
                    {ref.emailSecondary && (
                      <Link src={`mailto:${ref.emailSecondary}`} style={S.refEmail}>{'• '}{ref.emailSecondary}</Link>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </Page>
    </Document>
  )
}

// ─── HTML Preview ──────────────────────────────────────────────────────────────

const HS = {
  page: { background: '#fff', color: '#111', fontFamily: "'Cambria', 'Caladea', Georgia, serif", fontSize: '10px', lineHeight: '1.4', padding: 'clamp(16px, 4vw, 48px) clamp(12px, 4vw, 56px)', maxWidth: '900px', margin: '0 auto', boxShadow: '0 4px 32px rgba(0,0,0,0.5)', borderRadius: '2px', textAlign: 'justify' } as React.CSSProperties,
  name: { fontSize: '22px', fontFamily: "'Cambria', 'Caladea', Georgia, serif", fontWeight: 700, color: '#1a3a6b', marginBottom: '1px' } as React.CSSProperties,
  title: { fontSize: '10px', color: '#444', fontStyle: 'italic', marginBottom: '4px' } as React.CSSProperties,
  contactLine: { fontSize: '8.5px', color: '#444' } as React.CSSProperties,
  link: { fontSize: '8.5px', color: '#1a3a6b', textDecoration: 'none' } as React.CSSProperties,
  sep: { fontSize: '8.5px', color: '#999' } as React.CSSProperties,
  sectionHeader: { fontSize: '12px', fontWeight: 700, color: '#1a3a6b', marginTop: '8px', marginBottom: '3px', paddingBottom: '1px', borderBottom: '0.75px solid #1a3a6b', textTransform: 'uppercase' as const, letterSpacing: '0.02em' } as React.CSSProperties,
  row: { display: 'flex', gap: '6px', marginBottom: '5px' } as React.CSSProperties,
  contentCol: { flex: '86 1 0%' } as React.CSSProperties,
  dateCol: { flex: '14 0 0%', textAlign: 'right' as const } as React.CSSProperties,
  entryTitle: { fontWeight: 700, fontSize: '9px', color: '#111' } as React.CSSProperties,
  titleSuffix: { fontWeight: 400, fontStyle: 'italic', color: '#3d6ba8', fontSize: '9px' } as React.CSSProperties,
  date: { fontSize: '8px', color: '#555', fontStyle: 'italic', whiteSpace: 'pre-line' } as React.CSSProperties,
  subtitle: { fontSize: '8.5px', color: '#333', fontStyle: 'italic', marginBottom: '1px' } as React.CSSProperties,
  note: { fontSize: '8px', color: '#444', marginLeft: '8px' } as React.CSSProperties,
  bullet: { display: 'flex', gap: '4px', marginBottom: '1.5px', marginLeft: '4px', fontSize: '8.5px', color: '#333', lineHeight: '1.4' } as React.CSSProperties,
  summaryText: { fontSize: '8.5px', color: '#222', lineHeight: '1.5' } as React.CSSProperties,
  lastUpdated: { fontSize: '7.5px', color: '#999', marginTop: '2px' } as React.CSSProperties,
  refGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '12px' } as React.CSSProperties,
  refCard: { flex: '1 1 180px', minWidth: '160px' } as React.CSSProperties,
  refName: { fontWeight: 700, fontSize: '9px', color: '#111', textDecoration: 'underline' } as React.CSSProperties,
  refDetail: { fontSize: '8.5px', color: '#333' } as React.CSSProperties,
  refEmail: { fontSize: '8px', color: '#1a6bbf', textDecoration: 'none' } as React.CSSProperties,
  pubBlock: { marginBottom: '6px' } as React.CSSProperties,
  pubTitle: { fontWeight: 700, fontSize: '9px', color: '#111', marginBottom: '2px' } as React.CSSProperties,
  pubMeta: { fontSize: '8px', color: '#333', marginBottom: '1px' } as React.CSSProperties,
  skillRow: { display: 'flex', flexWrap: 'wrap' as const, marginBottom: '2px', fontSize: '8.5px' } as React.CSSProperties,
  skillLabel: { fontWeight: 700, color: '#1a3a6b' } as React.CSSProperties,
  skillItems: { color: '#333' } as React.CSSProperties,
}

function CVHtmlPreview({ data }: { data: CVData }) {
  const h = data.header
  return (
    <div className="cv-html-preview" style={HS.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={HS.name}>{h.name}</div>
          {h.title && <div style={HS.title}>{h.title}</div>}
          {h.contactLines.map((line, i) => (
            <div key={i} style={HS.contactLine}>{line}</div>
          ))}
          <div style={{ marginTop: '1px' }}>
            {h.links.map((link, i) => (
              <span key={i}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" style={HS.link}>{link.label}</a>
                {i < h.links.length - 1 && <span style={HS.sep}>{'\u00A0\u00A0|\u00A0\u00A0'}</span>}
              </span>
            ))}
          </div>
          <div style={HS.lastUpdated}>
            {h.lastUpdated}{' – '}
            <a href={h.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1a6bbf', textDecoration: 'none' }}>View live version</a>
          </div>
        </div>
        <img src={erauLogo} alt="ERAU" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
      </div>

      {/* Sections */}
      {data.sections.map((sec, si) => (
        <div key={si}>
          <h2 style={HS.sectionHeader}>{sec.header}</h2>
          {sec.text && <p style={HS.summaryText}>{sec.text}</p>}
          {sec.entries?.map((entry, ei) => (
            <div key={ei} style={HS.row}>
              <div style={HS.contentCol}>
                <div>
                  {entry.titleUrl
                    ? <a href={entry.titleUrl} target="_blank" rel="noopener noreferrer" style={{ ...HS.entryTitle, color: '#1a6bbf', textDecoration: 'none' }}>{entry.title}</a>
                    : <span style={HS.entryTitle}>{entry.title}</span>}
                  {entry.titleSuffix && <span style={HS.titleSuffix}>{` – ${entry.titleSuffix}`}</span>}
                </div>
                {entry.subtitle && (
                  <div style={HS.subtitle}>
                    {entry.subtitle}
                    {entry.gpa && <>{'\u00A0\u00A0|\u00A0\u00A0GPA: '}<strong>{entry.gpa.value}</strong>{'/' + entry.gpa.max}</>}
                  </div>
                )}
                {entry.notes?.map((note, ni) => (
                  <div key={ni} style={HS.note}>
                    {'• '}
                    {note.prefix}{note.url ? (
                      <a href={note.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a6bbf', textDecoration: 'none' }}>{note.text}</a>
                    ) : note.text}
                  </div>
                ))}
                {entry.bullets?.map((b, bi) => (
                  <div key={bi} style={HS.bullet}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <div style={HS.dateCol}>
                {entry.date && <span style={HS.date}>{entry.date}</span>}
              </div>
            </div>
          ))}
          {sec.subsections?.map((sub, ssi) => (
            <div key={ssi}>
              <h3 style={{ fontSize: '10.5px', fontWeight: 700, color: '#1a3a6b', marginTop: '5px', marginBottom: '2px', textDecoration: 'underline' }}>{sub.subheader}</h3>
              {sub.description && <p style={{ fontSize: '8px', color: '#555', fontStyle: 'italic', marginBottom: '3px', lineHeight: '1.4', margin: 0 }}>{sub.description}</p>}
              {sub.entries.map((entry, ei) => (
                <div key={ei} style={HS.row}>
                  <div style={HS.contentCol}>
                    <div>
                      {entry.titleUrl
                        ? <a href={entry.titleUrl} target="_blank" rel="noopener noreferrer" style={{ ...HS.entryTitle, color: '#1a6bbf', textDecoration: 'none' }}>{entry.title}</a>
                        : <span style={HS.entryTitle}>{entry.title}</span>}
                      {entry.titleSuffix && <span style={HS.titleSuffix}>{` – ${entry.titleSuffix}`}</span>}
                    </div>
                    {entry.subtitle && (
                      <div style={HS.subtitle}>
                        {entry.subtitle}
                        {entry.gpa && <>{'\u00A0\u00A0|\u00A0\u00A0GPA: '}<strong>{entry.gpa.value}</strong>{'/' + entry.gpa.max}</>}
                      </div>
                    )}
                    {entry.notes?.map((note, ni) => (
                      <div key={ni} style={HS.note}>
                        {'• '}
                        {note.prefix}{note.url ? <a href={note.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a6bbf', textDecoration: 'none' }}>{note.text}</a> : note.text}
                      </div>
                    ))}
                    {entry.bullets?.map((b, bi) => (
                      <div key={bi} style={HS.bullet}>
                        <span style={{ flexShrink: 0 }}>•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                  <div style={HS.dateCol}>
                    {entry.date && <span style={HS.date}>{entry.date}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {sec.publications?.map((pub) => (
            <div key={pub.index} style={HS.pubBlock}>
              <div style={HS.pubTitle}>[{pub.index}] {pub.title}</div>
              <div style={HS.pubMeta}>{pub.authors}{pub.venue ? `. ${pub.venue}` : ''}{pub.date ? `. ${pub.date}` : ''}</div>
              {pub.url && <a href={pub.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '7.5px', color: '#1a6bbf', textDecoration: 'none' }}>{pub.url}</a>}
            </div>
          ))}
          {sec.skillGroups && Object.entries(sec.skillGroups).map(([cat, items]) => (
            <div key={cat} style={HS.skillRow}>
              <span style={HS.skillLabel}>{cat}:&nbsp;</span>
              <span style={HS.skillItems}>{items.join(', ')}</span>
            </div>
          ))}
          {sec.references && (
            <div style={HS.refGrid}>
              {sec.references.map((ref, ri) => (
                <div key={ri} style={HS.refCard}>
                  <div style={HS.refName}>{ref.name}</div>
                  {(ref.title || ref.organization) && (
                    <div style={HS.refDetail}>
                      {'• '}{[ref.title, ref.organization].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {ref.email && (
                    <div><a href={`mailto:${ref.email}`} style={HS.refEmail}>{'• '}{ref.email}</a></div>
                  )}
                  {ref.emailSecondary && (
                    <div><a href={`mailto:${ref.emailSecondary}`} style={HS.refEmail}>{'• '}{ref.emailSecondary}</a></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CVExport() {
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'html' | 'pdf'>('html')

  useEffect(() => {
    loadPortfolioData()
      .then(data => { setPerson(data); setLoading(false) })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [])

  const cvData = useMemo(() => {
    if (!person) return null
    return buildCVData(person, __BUILD_DATE__)
  }, [person])

  const pdfDoc = useMemo(() => {
    if (!cvData) return null
    return <CVPdfDocument data={cvData} />
  }, [cvData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono">
        <span className="text-terminal-amber text-sm animate-pulse">Loading CV data...</span>
      </div>
    )
  }

  if (error || !person || !cvData) {
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
      <div className="max-w-4xl mx-auto mb-4 sm:mb-8 cv-page-chrome">
        <h1 className="text-xl sm:text-2xl font-bold text-terminal-amber tracking-tight">~/cv.pdf</h1>
        <p className="text-terminal-green text-xs sm:text-sm mt-1 opacity-80">
          Full academic and professional record — Generated from YAML source.
        </p>

        {/* Action Buttons + View Toggle */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-5 items-center">
          {pdfDoc && (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const PdfLink = PDFDownloadLink as any
            return (
              <PdfLink document={pdfDoc} fileName={`tylerprocko_cv_${new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')}.pdf`}>
                {({ loading: pdfLoading }: { loading: boolean }) => (
                  <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-900 border border-blue-500 text-blue-200 text-xs sm:text-sm font-mono hover:bg-blue-800 transition-colors rounded" disabled={pdfLoading}>
                    ⬇ Download PDF
                  </button>
                )}
              </PdfLink>
            )
          })()}

          <a href="https://github.com/PR0CK0/PR0CK0.github.io/blob/main/public/data/tyler-procko.yaml" target="_blank" rel="noopener noreferrer">
            <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800 border border-gray-600 text-gray-300 text-xs sm:text-sm font-mono hover:bg-gray-700 transition-colors rounded">
              {'<>'} View Raw YAML
            </button>
          </a>

          {/* View Toggle */}
          <div className="flex rounded overflow-hidden border border-terminal-border ml-auto">
            <button
              onClick={() => setViewMode('html')}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 text-[0.65rem] sm:text-xs font-mono transition-colors ${viewMode === 'html' ? 'bg-terminal-green/20 text-terminal-green' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
            >
              HTML
            </button>
            <button
              onClick={() => setViewMode('pdf')}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 text-[0.65rem] sm:text-xs font-mono transition-colors ${viewMode === 'pdf' ? 'bg-terminal-green/20 text-terminal-green' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview ── */}
      {viewMode === 'html' ? (
        <div className="max-w-4xl mx-auto">
          <CVHtmlPreview data={cvData} />
        </div>
      ) : (
        pdfDoc && (
          <div className="max-w-4xl mx-auto" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const Viewer = PDFViewer as any
              return (
                <Viewer width="100%" height="100%" style={{ border: 'none', borderRadius: '2px' }}>
                  {pdfDoc}
                </Viewer>
              )
            })()}
          </div>
        )
      )}
      <SiteFooter name={person.name} />
    </div>
  )
}
