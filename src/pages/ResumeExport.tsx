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
} from '@react-pdf/renderer'
import { loadPortfolioData } from '@/lib/yaml-loader'
import type { Person } from '@/lib/schema'
import SEO from '@/components/SEO'
import SiteFooter from '@/components/SiteFooter'
import { buildResumeData, type CVData, type CVSection, type CVEntry, type CVHeaderData } from '@/lib/cv-data'
import { PAGE_TITLE, PAGE_SUBTITLE, BTN_PRIMARY, BTN_SECONDARY, BTN_TOGGLE_ACTIVE, BTN_TOGGLE_INACTIVE, BTN_ROW, PAGE_CHROME, LOADING_SCREEN } from '@/lib/ui-constants'
import { useIsLightMode } from '@/lib/useIsLightMode'
import { FS, COLOR, px } from '@/lib/pdf-constants'

// ─── Custom Fonts ────────────────────────────────────────────────────────────
import CaladeaRegular from '@/fonts/caladea/Caladea-Regular.ttf'
import CaladeaBold from '@/fonts/caladea/Caladea-Bold.ttf'
import CaladeaItalic from '@/fonts/caladea/Caladea-Italic.ttf'
import CaladeaBoldItalic from '@/fonts/caladea/Caladea-BoldItalic.ttf'

Font.register({
  family: 'Caladea',
  fonts: [
    { src: CaladeaRegular, fontWeight: 'normal', fontStyle: 'normal' },
    { src: CaladeaBold, fontWeight: 'bold', fontStyle: 'normal' },
    { src: CaladeaItalic, fontWeight: 'normal', fontStyle: 'italic' },
    { src: CaladeaBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

// ─── PDF Styles ────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: { fontFamily: 'Caladea', fontSize: FS.page, color: COLOR.body, paddingTop: 36, paddingBottom: 36, paddingHorizontal: 44, lineHeight: 1.4, textAlign: 'justify' as const },
  name: { fontSize: FS.name, fontWeight: 'bold', color: COLOR.navy, marginBottom: 1 },
  title: { fontSize: FS.page, color: COLOR.meta, fontStyle: 'italic', marginBottom: 4 },
  contactLine: { fontSize: FS.subtitle, color: COLOR.meta },
  contactLink: { fontSize: FS.subtitle, color: COLOR.navy },
  contactSep: { fontSize: FS.subtitle, color: COLOR.sep },
  sectionHeader: { fontSize: FS.sectionHeader, fontWeight: 'bold', color: COLOR.navy, marginTop: 8, marginBottom: 3, paddingBottom: 1, borderBottomWidth: 0.75, borderBottomColor: COLOR.navy, borderBottomStyle: 'solid' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  row: { flexDirection: 'row' as const, marginBottom: 5 },
  contentCol: { flex: 86, paddingRight: 6 },
  dateCol: { flex: 14, alignItems: 'flex-end' as const },
  entryTitle: { fontWeight: 'bold', fontSize: FS.entryTitle, color: COLOR.body },
  titleSuffix: { fontWeight: 'normal', fontStyle: 'italic', color: COLOR.linkMid, fontSize: FS.entryTitle },
  titleLink: { fontSize: FS.small, color: COLOR.link, textDecoration: 'none' },
  titleLinkSep: { fontSize: FS.small, color: COLOR.sep },
  date: { fontSize: FS.small, color: COLOR.muted, fontStyle: 'italic', textAlign: 'right' as const },
  subtitle: { fontSize: FS.subtitle, color: COLOR.text, marginBottom: 1 },
  note: { fontSize: FS.small, color: COLOR.meta, marginLeft: 8 },
  bulletRow: { flexDirection: 'row' as const, marginBottom: 1.5, marginLeft: 4 },
  bulletDot: { fontSize: FS.subtitle, color: COLOR.text, marginRight: 4, width: 8 },
  bulletText: { fontSize: FS.subtitle, color: COLOR.text, flex: 1, lineHeight: 1.4 },
  summaryText: { fontSize: FS.subtitle, color: '#222', lineHeight: 1.5 },
  lastUpdated: { fontSize: FS.tiny, color: COLOR.sep, marginTop: 2 },
  skillLabel: { fontWeight: 'bold', fontSize: FS.subtitle, color: COLOR.navy },
  skillItems: { fontSize: FS.subtitle, color: COLOR.text },
  skillRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 2 },
})

const NBS = '\u00A0'

/** Parse [[marked]] text into styled segments. Used for both PDF and HTML renders. */
function parseBullet(text: string): Array<{ text: string; highlight: boolean }> {
  const parts: Array<{ text: string; highlight: boolean }> = []
  const re = /\[\[(.+?)\]\]/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), highlight: false })
    parts.push({ text: m[1], highlight: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), highlight: false })
  return parts
}

/** PDF bullet text with [[highlight]] support */
function PdfBulletText({ text, style }: { text: string; style: import('@react-pdf/types').Style }) {
  const parts = parseBullet(text)
  if (parts.length === 1 && !parts[0].highlight) return <Text style={style}>{text}</Text>
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.highlight
          ? <Text key={i} style={{ color: COLOR.link, fontStyle: 'italic' }}>{p.text}</Text>
          : <Text key={i}>{p.text}</Text>
      )}
    </Text>
  )
}

/** HTML bullet text with [[highlight]] support */
function HtmlBulletText({ text }: { text: string }) {
  const parts = parseBullet(text)
  if (parts.length === 1 && !parts[0].highlight) return <>{text}</>
  return (
    <>
      {parts.map((p, i) =>
        p.highlight
          ? <span key={i} style={{ color: COLOR.link, fontStyle: 'italic' }}>{p.text}</span>
          : <span key={i}>{p.text}</span>
      )}
    </>
  )
}

// ─── PDF Document ──────────────────────────────────────────────────────────────

function ResumePdfDocument({ data }: { data: CVData }) {
  const h = data.header
  return (
    <Document title={`${h.name} — Resume`} author={h.name}>
      <Page size="LETTER" style={S.page}>
        {/* Header */}
        <View style={{ marginBottom: 10 }}>
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
            <Link src={h.sourceUrl} style={{ color: COLOR.link, textDecoration: 'none', fontSize: FS.tiny }}>View live version</Link>
          </Text>
        </View>

        {/* Sections */}
        {data.sections.map((sec, si) => (
          <View key={si}>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.75, borderBottomColor: COLOR.navy, borderBottomStyle: 'solid' as const, marginTop: 8, marginBottom: 3, paddingBottom: 1 }}>
              <Text style={{ fontSize: FS.sectionHeader, fontWeight: 'bold', color: COLOR.navy, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{sec.header}</Text>
              {sec.headerLinks?.map((hl, hli) => (
                <Text key={hli} style={{ fontSize: FS.small, color: COLOR.link, fontStyle: 'italic', fontWeight: 'normal', marginLeft: 4 }}>
                  {hli === 0 ? ' – ' : ' · '}<Link src={hl.url} style={{ color: COLOR.link, textDecoration: 'none' }}>{hl.label}</Link>
                </Text>
              ))}
            </View>
            {sec.text && <Text style={S.summaryText}>{sec.text}</Text>}
            {sec.entries?.map((entry, ei) => (
              <View key={ei} style={entry.fullWidth ? { marginBottom: 5 } : S.row}>
                <View style={entry.fullWidth ? undefined : S.contentCol}>
                  <Text style={S.entryTitle}>
                    {entry.titleUrl ? <Link src={entry.titleUrl} style={{ color: COLOR.link, textDecoration: 'none', fontWeight: 'bold' }}>{entry.title}</Link> : entry.title}
                    {entry.titleSuffix && <Text style={S.titleSuffix}>{` – ${entry.titleSuffix}`}</Text>}
                    {entry.titleLinks?.map((tl, tli) => (
                      <Text key={tli} style={{ fontWeight: 'normal' }}>
                        <Text style={S.titleLinkSep}>{tli === 0 ? '  ' : ' · '}</Text>
                        <Link src={tl.url} style={S.titleLink}>{tl.label}</Link>
                      </Text>
                    ))}
                  </Text>
                  {entry.subtitle && (
                    <Text style={S.subtitle}>
                      <Text style={{ fontStyle: 'italic' }}>{entry.subtitle}</Text>
                      {entry.gpa && <>{'  |  GPA: '}<Text style={{ fontWeight: 'bold' }}>{entry.gpa.value}</Text>{'/' + entry.gpa.max}</>}
                    </Text>
                  )}
                  {entry.notes?.map((note, ni) => (
                    <Text key={ni} style={[S.note, note.indent ? { marginLeft: 20 } : {}]}>
                      {'• '}
                      {note.prefix}{note.url ? <Link src={note.url} style={{ color: COLOR.link, textDecoration: 'none' }}>{note.text}</Link> : note.text}
                    </Text>
                  ))}
                  {entry.bullets?.map((b, bi) => (
                    <View key={bi} style={S.bulletRow}>
                      <Text style={S.bulletDot}>•</Text>
                      <PdfBulletText text={b} style={S.bulletText} />
                    </View>
                  ))}
                </View>
                {!entry.fullWidth && (
                  <View style={S.dateCol}>
                    {entry.date && <Text style={S.date}>{entry.date}</Text>}
                  </View>
                )}
              </View>
            ))}
            {sec.skillGroups && Object.entries(sec.skillGroups).map(([cat, items]) => (
              <Text key={cat} style={[S.skillItems, { marginBottom: 2 }]}>
                <Text style={S.skillLabel}>{cat}: </Text>{items.join(', ')}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}

// ─── HTML Preview ──────────────────────────────────────────────────────────────

const HS = {
  page: { background: '#fff', color: COLOR.body, fontFamily: "'Cambria', 'Caladea', Georgia, serif", fontSize: px(FS.page), lineHeight: '1.4', padding: 'clamp(16px, 4vw, 48px) clamp(12px, 4vw, 56px)', maxWidth: '900px', margin: '0 auto', boxShadow: '0 4px 32px rgba(0,0,0,0.5)', borderRadius: '2px', textAlign: 'justify' } as React.CSSProperties,
  name: { fontSize: px(FS.name), fontWeight: 700, color: COLOR.navy, marginBottom: '1px' } as React.CSSProperties,
  title: { fontSize: px(FS.page), color: COLOR.meta, fontStyle: 'italic', marginBottom: '4px' } as React.CSSProperties,
  contactLine: { fontSize: px(FS.subtitle), color: COLOR.meta } as React.CSSProperties,
  link: { fontSize: px(FS.subtitle), color: COLOR.navy, textDecoration: 'none' } as React.CSSProperties,
  sep: { fontSize: px(FS.subtitle), color: COLOR.sep } as React.CSSProperties,
  sectionHeader: { fontSize: px(FS.sectionHeader), fontWeight: 700, color: COLOR.navy, marginTop: '8px', marginBottom: '3px', paddingBottom: '1px', borderBottom: `0.75px solid ${COLOR.navy}`, textTransform: 'uppercase' as const, letterSpacing: '0.02em' } as React.CSSProperties,
  row: { display: 'flex', gap: '6px', marginBottom: '5px' } as React.CSSProperties,
  contentCol: { flex: '86 1 0%' } as React.CSSProperties,
  dateCol: { flex: '14 0 0%', textAlign: 'right' as const } as React.CSSProperties,
  entryTitle: { fontWeight: 700, fontSize: px(FS.entryTitle), color: COLOR.body } as React.CSSProperties,
  titleSuffix: { fontWeight: 400, fontStyle: 'italic', color: COLOR.linkMid, fontSize: px(FS.entryTitle) } as React.CSSProperties,
  titleLink: { fontSize: px(FS.small), color: COLOR.link, textDecoration: 'none' } as React.CSSProperties,
  titleLinkSep: { fontSize: px(FS.small), color: COLOR.sep } as React.CSSProperties,
  date: { fontSize: px(FS.small), color: COLOR.muted, fontStyle: 'italic', whiteSpace: 'pre-line' } as React.CSSProperties,
  subtitle: { fontSize: px(FS.subtitle), color: COLOR.text, fontStyle: 'italic', marginBottom: '1px' } as React.CSSProperties,
  note: { fontSize: px(FS.small), color: COLOR.meta, marginLeft: '8px' } as React.CSSProperties,
  bullet: { display: 'flex', gap: '4px', marginBottom: '1.5px', marginLeft: '4px', fontSize: px(FS.subtitle), color: COLOR.text, lineHeight: '1.4' } as React.CSSProperties,
  summaryText: { fontSize: px(FS.subtitle), color: '#222', lineHeight: '1.5' } as React.CSSProperties,
  lastUpdated: { fontSize: px(FS.tiny), color: COLOR.sep, marginTop: '2px' } as React.CSSProperties,
  skillRow: { marginBottom: '2px', fontSize: px(FS.subtitle) } as React.CSSProperties,
  skillLabel: { fontWeight: 700, color: COLOR.navy } as React.CSSProperties,
  skillItems: { color: COLOR.text } as React.CSSProperties,
}

function ResumeHtmlPreview({ data }: { data: CVData }) {
  const isLight = useIsLightMode()
  const h = data.header
  return (
    <div className="cv-html-preview" style={{ ...HS.page, boxShadow: isLight ? '0 2px 16px rgba(0,0,0,0.12)' : '0 4px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ marginBottom: '10px' }}>
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
          <a href={h.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none' }}>View live version</a>
        </div>
      </div>

      {data.sections.map((sec, si) => (
        <div key={si}>
          <h2 style={HS.sectionHeader}>
            {sec.header}
            {sec.headerLinks?.map((hl, hli) => (
              <span key={hli} style={{ fontSize: px(FS.small), fontWeight: 400, textTransform: 'none', fontStyle: 'italic', marginLeft: '4px', verticalAlign: 'middle' }}>
                {hli === 0 ? ' – ' : ' · '}<a href={hl.url} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none' }}>{hl.label}</a>
              </span>
            ))}
          </h2>
          {sec.text && <p style={HS.summaryText}>{sec.text}</p>}
          {sec.entries?.map((entry, ei) => (
            <div key={ei} style={entry.fullWidth ? { marginBottom: '5px' } : HS.row}>
              <div style={entry.fullWidth ? undefined : HS.contentCol}>
                <div>
                  {entry.titleUrl
                    ? <a href={entry.titleUrl} target="_blank" rel="noopener noreferrer" style={{ ...HS.entryTitle, color: COLOR.link, textDecoration: 'none' }}>{entry.title}</a>
                    : <span style={HS.entryTitle}>{entry.title}</span>}
                  {entry.titleSuffix && <span style={HS.titleSuffix}>{` – ${entry.titleSuffix}`}</span>}
                  {entry.titleLinks?.map((tl, tli) => (
                    <span key={tli}>
                      <span style={HS.titleLinkSep}>{tli === 0 ? '\u00A0\u00A0' : ' · '}</span>
                      <a href={tl.url} target="_blank" rel="noopener noreferrer" style={HS.titleLink}>{tl.label}</a>
                    </span>
                  ))}
                </div>
                {entry.subtitle && (
                  <div style={HS.subtitle}>
                    {entry.subtitle}
                    {entry.gpa && <>{'\u00A0\u00A0|\u00A0\u00A0GPA: '}<strong>{entry.gpa.value}</strong>{'/' + entry.gpa.max}</>}
                  </div>
                )}
                {entry.notes?.map((note, ni) => (
                  <div key={ni} style={{ ...HS.note, ...(note.indent ? { marginLeft: '24px' } : {}) }}>
                    {'• '}
                    {note.prefix}{note.url ? <a href={note.url} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none' }}>{note.text}</a> : note.text}
                  </div>
                ))}
                {entry.bullets?.map((b, bi) => (
                  <div key={bi} style={HS.bullet}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span><HtmlBulletText text={b} /></span>
                  </div>
                ))}
              </div>
              {!entry.fullWidth && (
                <div style={HS.dateCol}>
                  {entry.date && <span style={HS.date}>{entry.date}</span>}
                </div>
              )}
            </div>
          ))}
          {sec.skillGroups && Object.entries(sec.skillGroups).map(([cat, items]) => (
            <div key={cat} style={HS.skillRow}>
              <span style={HS.skillLabel}>{cat}:&nbsp;</span>{items.join(', ')}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ResumeExport() {
  const [person, setPerson] = useState<Person | null>(null)
  const isLight = useIsLightMode()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'html' | 'pdf'>('html')

  useEffect(() => {
    loadPortfolioData()
      .then(data => { setPerson(data); setLoading(false) })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [])

  const resumeData = useMemo(() => {
    if (!person) return null
    return buildResumeData(person, __BUILD_DATE__)
  }, [person])

  const pdfDoc = useMemo(() => {
    if (!resumeData) return null
    return <ResumePdfDocument data={resumeData} />
  }, [resumeData])

  if (loading) {
    return (
      <div className={LOADING_SCREEN}>
        <span className="text-terminal-amber text-sm animate-pulse">Loading resume data...</span>
      </div>
    )
  }

  if (error || !person || !resumeData) {
    return (
      <div className={LOADING_SCREEN}>
        <span className="text-red-400 text-sm">Error loading resume: {error ?? 'Unknown error'}</span>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-terminal-bg font-mono flex flex-col pt-10"
      style={{
        backgroundImage: [
          `repeating-linear-gradient(0deg, transparent, transparent 2px, ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.15)'} 2px, ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.15)'} 4px)`,
          'linear-gradient(rgba(77,159,255,0.03) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(77,159,255,0.03) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: 'auto, 40px 40px, 40px 40px',
      }}
    >
      <SEO
        title="Resume"
        description="Resume of Tyler T. Procko, Ph.D. — work experience, projects, and technical skills in AI, ontology engineering, and knowledge graphs."
        path="/resume"
      />
      <div className={PAGE_CHROME}>
        <h1 className={`${PAGE_TITLE} text-terminal-amber`}>~/resume.pdf</h1>
        <p className={`text-terminal-green ${PAGE_SUBTITLE}`}>
          Work experience, projects, and skills — Generated from YAML source.
        </p>

        <div className={BTN_ROW}>
          {pdfDoc && (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const PdfLink = PDFDownloadLink as any
            return (
              <PdfLink document={pdfDoc} fileName={`tylerprocko_resume_${new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')}.pdf`}>
                {({ loading: pdfLoading }: { loading: boolean }) => (
                  <button className={BTN_PRIMARY} disabled={pdfLoading}>
                    ⬇ Download PDF
                  </button>
                )}
              </PdfLink>
            )
          })()}

          <a href="https://github.com/PR0CK0/PR0CK0.github.io/blob/main/public/data/tyler-procko.yaml" target="_blank" rel="noopener noreferrer">
            <button className={BTN_SECONDARY}>
              {'<>'} View Raw YAML
            </button>
          </a>

          <div className="flex rounded overflow-hidden border border-terminal-border ml-auto">
            <button onClick={() => setViewMode('html')} className={viewMode === 'html' ? BTN_TOGGLE_ACTIVE : BTN_TOGGLE_INACTIVE}>
              HTML
            </button>
            <button onClick={() => setViewMode('pdf')} className={viewMode === 'pdf' ? BTN_TOGGLE_ACTIVE : BTN_TOGGLE_INACTIVE}>
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grow w-full px-4 pb-10">
        {viewMode === 'html' ? (
          <div className="max-w-4xl mx-auto">
            <ResumeHtmlPreview data={resumeData} />
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
      </div>
      <SiteFooter name={person.name} />
    </div>
  )
}
