// ─── Shared PDF/HTML style constants ─────────────────────────────────────────
// Used by CVExport.tsx and ResumeExport.tsx.
// FS values are plain numbers for react-pdf StyleSheet; use px(n) for HTML.

export const FS = {
  page:             10,
  name:             22,
  sectionHeader:    12,
  subsectionHeader: 10.5,
  clearSubHeader:   9.5,
  entryTitle:       9,
  subtitle:         8.5,   // contact lines, subtitles, bullets, skill items, summary
  small:            8,     // dates, notes, pub meta, title links
  tiny:             7.5,   // last updated
} as const

export const COLOR = {
  navy:     '#1a3a6b',   // primary brand / section headers
  link:     '#1a6bbf',   // hyperlinks
  linkMid:  '#3d6ba8',   // title suffix / muted link
  body:     '#111',      // main text
  text:     '#333',      // secondary text (bullets, subtitles)
  meta:     '#444',      // meta text (contact, notes)
  muted:    '#555',      // dates
  sep:      '#999',      // separators, last-updated
} as const

/** Convert a FS number to a CSS px string for HTML inline styles. */
export const px = (n: number): string => `${n}px`
