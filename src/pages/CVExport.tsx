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
import { PAGE_TITLE, PAGE_SUBTITLE, BTN_PRIMARY, BTN_SECONDARY, BTN_TOGGLE_ACTIVE, BTN_TOGGLE_INACTIVE, BTN_ROW, PAGE_CHROME, LOADING_SCREEN } from '@/lib/ui-constants'
import { useIsLightMode } from '@/lib/useIsLightMode'
import { FS, COLOR, px } from '@/lib/pdf-constants'
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
  page: { fontFamily: 'Caladea', fontSize: FS.page, color: COLOR.body, paddingTop: 36, paddingBottom: 36, paddingHorizontal: 44, lineHeight: 1.4, textAlign: 'justify' as const },
  name: { fontSize: FS.name, fontFamily: 'Caladea', fontWeight: 'bold', color: COLOR.navy, marginBottom: 1 },
  title: { fontSize: FS.page, color: COLOR.meta, fontStyle: 'italic', marginBottom: 4 },
  contactLine: { fontSize: FS.subtitle, color: COLOR.meta },
  contactLink: { fontSize: FS.subtitle, color: COLOR.navy },
  contactSep: { fontSize: FS.subtitle, color: COLOR.sep },
  sectionHeader: { fontSize: FS.sectionHeader, fontWeight: 'bold', color: COLOR.navy, marginTop: 8, marginBottom: 3, paddingBottom: 1, borderBottomWidth: 0.75, borderBottomColor: COLOR.navy, borderBottomStyle: 'solid' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  subsectionHeader: { fontSize: FS.subsectionHeader, fontWeight: 'bold', color: COLOR.navy, marginTop: 5, marginBottom: 2, textDecoration: 'underline' },
  subsectionDesc: { fontSize: FS.small, color: COLOR.muted, fontStyle: 'italic', marginBottom: 3, lineHeight: 1.4 },
  row: { flexDirection: 'row' as const, marginBottom: 5 },
  contentCol: { flex: 82, paddingRight: 6 },
  dateCol: { flex: 18, alignItems: 'flex-end' as const },
  clearanceDateCol: { flex: 25, alignItems: 'flex-end' as const },
  entryTitle: { fontWeight: 'bold', fontSize: FS.entryTitle, color: COLOR.body },
  titleSuffix: { fontWeight: 'normal', fontStyle: 'italic', color: COLOR.linkMid, fontSize: FS.entryTitle },
  date: { fontSize: FS.small, color: COLOR.muted, fontStyle: 'italic', textAlign: 'right' as const },
  subtitle: { fontSize: FS.subtitle, color: COLOR.text, marginBottom: 1 },
  note: { fontSize: FS.small, color: COLOR.meta, marginLeft: 8 },
  bulletRow: { flexDirection: 'row' as const, marginBottom: 1.5, marginLeft: 4 },
  bulletDot: { fontSize: FS.subtitle, color: COLOR.text, marginRight: 4, width: 8 },
  bulletText: { fontSize: FS.subtitle, color: COLOR.text, flex: 1, lineHeight: 1.4 },
  pubTitle: { fontWeight: 'bold', fontSize: FS.entryTitle, color: COLOR.body, marginBottom: 2 },
  pubMeta: { fontSize: FS.small, color: COLOR.text, marginBottom: 1 },
  pubBlock: { marginBottom: 6 },
  skillLabel: { fontWeight: 'bold', fontSize: FS.subtitle, color: COLOR.navy },
  skillItems: { fontSize: FS.subtitle, color: COLOR.text },
  skillRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 2 },
  summaryText: { fontSize: FS.subtitle, color: '#222', lineHeight: 1.5 },
  lastUpdated: { fontSize: FS.tiny, color: COLOR.sep, marginTop: 2 },
  titleLink: { fontSize: FS.small, color: COLOR.link, textDecoration: 'none' },
  titleLinkSep: { fontSize: FS.small, color: COLOR.sep },
  refGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
  refCard: { flex: 1, minWidth: 160 },
  refName: { fontWeight: 'bold', fontSize: FS.entryTitle, color: COLOR.body, textDecoration: 'underline' },
  refDetail: { fontSize: FS.subtitle, color: COLOR.text },
  refEmail: { fontSize: FS.small, color: COLOR.link },
  clearSubHeader: { fontWeight: 'bold', fontSize: FS.clearSubHeader, color: COLOR.navy, textDecoration: 'underline', marginBottom: 2, marginTop: 4 },
  clearStatusText: { fontSize: FS.subtitle, color: '#222', lineHeight: 1.5, marginBottom: 4 },
})

const NBS = '\u00A0' // non-breaking space

// Parses [label](url) inline links within bullet text for PDF rendering
function PdfBulletText({ text }: { text: string }) {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<Link key={m.index} src={m[2]} style={{ color: COLOR.link, textDecoration: 'none' }}>{m[1]}</Link>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <Text style={S.bulletText}>{parts}</Text>
}

// Parses [label](url) inline links within bullet text for HTML rendering
function HtmlBulletText({ text }: { text: string }) {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none' }}>{m[1]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span>{parts}</span>
}

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
              <Link src={h.sourceUrl} style={{ color: COLOR.link, textDecoration: 'none', fontSize: FS.tiny }}>View live version</Link>
            </Text>
          </View>
          <Image src={erauLogo} style={{ width: 70, height: 70, objectFit: 'contain' }} />
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
            {/* Simple text */}
            {sec.text && <Text style={S.summaryText}>{sec.text}</Text>}
            {/* Entries (education, work, projects, awards, certs, clearance) */}
            {sec.entries?.map((entry, ei) => (
              <View key={ei} style={S.row}>
                <View style={S.contentCol}>
                  <Text style={S.entryTitle}>
                    {entry.titleUrl ? <Link src={entry.titleUrl} style={{ color: '#111', textDecoration: 'none' }}>{entry.title}</Link> : entry.title}
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
                    <Text key={ni} style={S.note}>
                      {'• '}
                      {note.prefix}{note.url ? (
                        <Link src={note.url} style={{ color: COLOR.link, textDecoration: 'none' }}>{note.text}</Link>
                      ) : note.text}
                    </Text>
                  ))}
                  {entry.bullets?.map((b, bi) => (
                    <View key={bi} style={S.bulletRow}>
                      <Text style={S.bulletDot}>•</Text>
                      <PdfBulletText text={b} />
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
                        <Text key={ni} style={S.note}>
                          {'• '}
                          {note.prefix}{note.url ? <Link src={note.url} style={{ color: COLOR.link, textDecoration: 'none' }}>{note.text}</Link> : note.text}
                        </Text>
                      ))}
                      {entry.bullets?.map((b, bi) => (
                        <View key={bi} style={S.bulletRow}>
                          <Text style={S.bulletDot}>•</Text>
                          <PdfBulletText text={b} />
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
            {sec.pubGroups?.map((group, gi) => (
              <View key={gi}>
                {group.subheader && <Text style={S.subsectionHeader}>{group.subheader}</Text>}
                {group.items.map((pub) => (
                  <View key={pub.index} style={{ ...S.row, ...S.pubBlock }}>
                    <View style={S.contentCol}>
                      <Text style={S.pubTitle}>
                        {pub.url
                          ? <><Link src={pub.url} style={{ color: COLOR.link, textDecoration: 'none', fontWeight: 'bold' }}>{`[${pub.index}]`}</Link>{` ${pub.title}`}</>
                          : `[${pub.index}] ${pub.title}`}
                      </Text>
                      <Text style={S.pubMeta}>
                        {pub.authors}{pub.venue ? <Text style={{ fontStyle: 'italic' }}>{`. ${pub.venue}`}</Text> : ''}
                      </Text>
                    </View>
                    <View style={S.dateCol}>
                      {pub.date && <Text style={S.date}>{pub.date}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ))}
            {/* Skills */}
            {sec.skillGroups && Object.entries(sec.skillGroups).map(([cat, items]) => (
              <Text key={cat} style={[S.skillItems, { marginBottom: 2 }]}>
                <Text style={S.skillLabel}>{cat}: </Text>{items.join(', ')}
              </Text>
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
            {/* Government Clearances */}
            {sec.clearances && (
              <View>
                {sec.clearances.currentStatus && (
                  <View>
                    <Text style={S.clearSubHeader}>Current Clearance Status</Text>
                    <Text style={S.clearStatusText}>{sec.clearances.currentStatus}</Text>
                  </View>
                )}
                {sec.clearances.past.length > 0 && (
                  <View>
                    <Text style={S.clearSubHeader}>Past Clearances</Text>
                    {sec.clearances.past.map((c, ci) => (
                      <View key={ci} style={S.row}>
                        <View style={S.contentCol}>
                          <Text style={S.entryTitle}>
                            {c.level}{', '}
                            <Text style={{ fontWeight: 'normal', fontStyle: 'italic' }}>{'cleared by '}{c.grantor}{', retained by '}{c.holder}</Text>
                          </Text>
                        </View>
                        <View style={S.clearanceDateCol}>
                          <Text style={S.date}>{c.dateRange}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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
  page: { background: '#fff', color: COLOR.body, fontFamily: "'Cambria', 'Caladea', Georgia, serif", fontSize: px(FS.page), lineHeight: '1.4', padding: 'clamp(16px, 4vw, 48px) clamp(12px, 4vw, 56px)', maxWidth: '900px', margin: '0 auto', boxShadow: '0 4px 32px rgba(0,0,0,0.5)', borderRadius: '2px', textAlign: 'justify' } as React.CSSProperties,
  name: { fontSize: px(FS.name), fontFamily: "'Cambria', 'Caladea', Georgia, serif", fontWeight: 700, color: COLOR.navy, marginBottom: '1px' } as React.CSSProperties,
  title: { fontSize: px(FS.page), color: COLOR.meta, fontStyle: 'italic', marginBottom: '4px' } as React.CSSProperties,
  contactLine: { fontSize: px(FS.subtitle), color: COLOR.meta } as React.CSSProperties,
  link: { fontSize: px(FS.subtitle), color: COLOR.navy, textDecoration: 'none' } as React.CSSProperties,
  sep: { fontSize: px(FS.subtitle), color: COLOR.sep } as React.CSSProperties,
  sectionHeader: { fontSize: px(FS.sectionHeader), fontWeight: 700, color: COLOR.navy, marginTop: '8px', marginBottom: '3px', paddingBottom: '1px', borderBottom: `0.75px solid ${COLOR.navy}`, textTransform: 'uppercase' as const, letterSpacing: '0.02em' } as React.CSSProperties,
  row: { display: 'flex', gap: '6px', marginBottom: '5px' } as React.CSSProperties,
  contentCol: { flex: '82 1 0%' } as React.CSSProperties,
  dateCol: { flex: '18 0 0%', textAlign: 'right' as const } as React.CSSProperties,
  clearanceDateCol: { flex: '25 0 0%', textAlign: 'right' as const } as React.CSSProperties,
  entryTitle: { fontWeight: 700, fontSize: px(FS.entryTitle), color: COLOR.body } as React.CSSProperties,
  titleSuffix: { fontWeight: 400, fontStyle: 'italic', color: COLOR.linkMid, fontSize: px(FS.entryTitle) } as React.CSSProperties,
  date: { fontSize: px(FS.small), color: COLOR.muted, fontStyle: 'italic', whiteSpace: 'pre-line' } as React.CSSProperties,
  subtitle: { fontSize: px(FS.subtitle), color: COLOR.text, fontStyle: 'italic', marginBottom: '1px' } as React.CSSProperties,
  note: { fontSize: px(FS.small), color: COLOR.meta, marginLeft: '8px' } as React.CSSProperties,
  bullet: { display: 'flex', gap: '4px', marginBottom: '1.5px', marginLeft: '4px', fontSize: px(FS.subtitle), color: COLOR.text, lineHeight: '1.4' } as React.CSSProperties,
  summaryText: { fontSize: px(FS.subtitle), color: '#222', lineHeight: '1.5' } as React.CSSProperties,
  lastUpdated: { fontSize: px(FS.tiny), color: COLOR.sep, marginTop: '2px' } as React.CSSProperties,
  refGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '12px' } as React.CSSProperties,
  refCard: { flex: '1 1 180px', minWidth: '160px' } as React.CSSProperties,
  refName: { fontWeight: 700, fontSize: px(FS.entryTitle), color: COLOR.body, textDecoration: 'underline' } as React.CSSProperties,
  refDetail: { fontSize: px(FS.subtitle), color: COLOR.text } as React.CSSProperties,
  refEmail: { fontSize: px(FS.small), color: COLOR.link, textDecoration: 'none' } as React.CSSProperties,
  titleLink: { fontSize: px(FS.small), color: COLOR.link, textDecoration: 'none' } as React.CSSProperties,
  titleLinkSep: { fontSize: px(FS.small), color: COLOR.sep } as React.CSSProperties,
  clearSubHeader: { fontWeight: 700, fontSize: px(FS.clearSubHeader), color: COLOR.navy, textDecoration: 'underline', marginBottom: '2px', marginTop: '4px' } as React.CSSProperties,
  clearStatusText: { fontSize: px(FS.subtitle), color: '#222', lineHeight: '1.5', marginBottom: '4px' } as React.CSSProperties,
  pubBlock: { marginBottom: '6px' } as React.CSSProperties,
  pubTitle: { fontWeight: 700, fontSize: px(FS.entryTitle), color: COLOR.body, marginBottom: '2px' } as React.CSSProperties,
  pubMeta: { fontSize: px(FS.small), color: COLOR.text, marginBottom: '1px' } as React.CSSProperties,
  skillRow: { marginBottom: '2px', fontSize: px(FS.subtitle) } as React.CSSProperties,
  skillLabel: { fontWeight: 700, color: COLOR.navy } as React.CSSProperties,
  skillItems: { color: COLOR.text } as React.CSSProperties,
}

function CVHtmlPreview({ data }: { data: CVData }) {
  const isLight = useIsLightMode()
  const h = data.header
  return (
    <div className="cv-html-preview" style={{ ...HS.page, boxShadow: isLight ? '0 2px 16px rgba(0,0,0,0.12)' : '0 4px 32px rgba(0,0,0,0.5)' }}>
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
            <a href={h.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none' }}>View live version</a>
          </div>
        </div>
        <img src={erauLogo} alt="ERAU" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
      </div>

      {/* Sections */}
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
            <div key={ei} style={HS.row}>
              <div style={HS.contentCol}>
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
                  <div key={ni} style={HS.note}>
                    {'• '}
                    {note.prefix}{note.url ? (
                      <a href={note.url} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none' }}>{note.text}</a>
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
              <h3 style={{ fontSize: px(FS.subsectionHeader), fontWeight: 700, color: COLOR.navy, marginTop: '5px', marginBottom: '2px', textDecoration: 'underline' }}>{sub.subheader}</h3>
              {sub.description && <p style={{ fontSize: px(FS.small), color: COLOR.muted, fontStyle: 'italic', marginBottom: '3px', lineHeight: '1.4', margin: 0 }}>{sub.description}</p>}
              {sub.entries.map((entry, ei) => (
                <div key={ei} style={HS.row}>
                  <div style={HS.contentCol}>
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
                      <div key={ni} style={HS.note}>
                        {'• '}
                        {note.prefix}{note.url ? <a href={note.url} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none' }}>{note.text}</a> : note.text}
                      </div>
                    ))}
                    {entry.bullets?.map((b, bi) => (
                      <div key={bi} style={HS.bullet}>
                        <span style={{ flexShrink: 0 }}>•</span>
                        <HtmlBulletText text={b} />
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
          {sec.pubGroups?.map((group, gi) => (
            <div key={gi}>
              {group.subheader && <h3 style={{ fontSize: px(FS.subsectionHeader), fontWeight: 700, color: COLOR.navy, marginTop: '5px', marginBottom: '2px', textDecoration: 'underline' }}>{group.subheader}</h3>}
              {group.items.map((pub) => (
                <div key={pub.index} style={{ ...HS.row, ...HS.pubBlock }}>
                  <div style={HS.contentCol}>
                    <div style={HS.pubTitle}>
                      {pub.url
                        ? <><a href={pub.url} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.link, textDecoration: 'none', fontWeight: 700 }}>{`[${pub.index}]`}</a>{` ${pub.title}`}</>
                        : `[${pub.index}] ${pub.title}`}
                    </div>
                    <div style={HS.pubMeta}>
                      {pub.authors}{pub.venue ? <span style={{ fontStyle: 'italic' }}>{`. ${pub.venue}`}</span> : ''}
                    </div>
                  </div>
                  <div style={HS.dateCol}>
                    {pub.date && <span style={HS.date}>{pub.date}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {sec.skillGroups && Object.entries(sec.skillGroups).map(([cat, items]) => (
            <div key={cat} style={HS.skillRow}>
              <span style={HS.skillLabel}>{cat}:&nbsp;</span>{items.join(', ')}
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
          {sec.clearances && (
            <div>
              {sec.clearances.currentStatus && (
                <div>
                  <div style={HS.clearSubHeader}>Current Clearance Status</div>
                  <div style={HS.clearStatusText}>{sec.clearances.currentStatus}</div>
                </div>
              )}
              {sec.clearances.past.length > 0 && (
                <div>
                  <div style={HS.clearSubHeader}>Past Clearances</div>
                  {sec.clearances.past.map((c, ci) => (
                    <div key={ci} style={HS.row}>
                      <div style={HS.contentCol}>
                        <span style={HS.entryTitle}>
                          {c.level}{', '}
                          <span style={{ fontWeight: 400, fontStyle: 'italic' }}>{'cleared by '}{c.grantor}{', retained by '}{c.holder}</span>
                        </span>
                      </div>
                      <div style={HS.clearanceDateCol}>
                        <span style={HS.date}>{c.dateRange}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
  const isLight = useIsLightMode()
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
      <div className={LOADING_SCREEN}>
        <span className="text-terminal-amber text-sm animate-pulse">Loading CV data...</span>
      </div>
    )
  }

  if (error || !person || !cvData) {
    return (
      <div className={LOADING_SCREEN}>
        <span className="text-red-400 text-sm">Error loading CV: {error ?? 'Unknown error'}</span>
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
        title="CV / Curriculum Vitae"
        description="Full academic and professional CV of Tyler T. Procko, Ph.D. — publications, work experience, education, and skills."
        path="/cv"
      />
      {/* ── Page Header ── */}
      <div className={PAGE_CHROME}>
        <h1 className={`${PAGE_TITLE} text-terminal-amber`}>~/cv.pdf</h1>
        <p className={`text-terminal-green ${PAGE_SUBTITLE}`}>
          Full academic and professional record — Generated from YAML source.
        </p>

        {/* Action Buttons + View Toggle */}
        <div className={BTN_ROW}>
          {pdfDoc && (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const PdfLink = PDFDownloadLink as any
            return (
              <PdfLink document={pdfDoc} fileName={`tylerprocko_cv_${new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')}.pdf`}>
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

          {/* View Toggle */}
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

      {/* ── Preview ── */}
      <div className="grow w-full px-4 pb-10">
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
      </div>
      <SiteFooter name={person.name} />
    </div>
  )
}
