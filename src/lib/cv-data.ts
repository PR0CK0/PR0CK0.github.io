import type { Person, Skill } from '@/lib/schema'
import { TECH_CATEGORIES } from '@/lib/tech-categories'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CVLink {
  label: string
  url: string
}

export interface CVEntry {
  title: string           // bold text
  titleUrl?: string       // optional link on title
  titleSuffix?: string    // italic text after title (org, location)
  titleLinks?: Array<{ label: string; url: string }>  // inline links after title (e.g. GitHub · Live)
  date?: string           // right column
  subtitle?: string       // line below title (institution)
  gpa?: { value: string; max: string }  // GPA with bold value
  notes?: Array<{ prefix?: string; text: string; url?: string; indent?: boolean }>  // bullet notes with optional links
  bullets?: string[]      // description bullets
  fullWidth?: boolean     // skip date column, content spans full width
}

export interface CVSubsection {
  subheader: string
  description?: string  // intro paragraph for the subsection
  entries: CVEntry[]
}

export interface CVSection {
  header: string
  headerLinks?: Array<{ label: string; url: string }>
  entries?: CVEntry[]
  subsections?: CVSubsection[]
  // For skills section
  skillGroups?: Record<string, string[]>
  // For simple text sections
  text?: string
  // For publications (different format) — grouped by status
  pubGroups?: Array<{
    subheader?: string
    items: Array<{
      index: number
      title: string
      authors: string
      venue: string
      date: string
      url?: string
    }>
  }>
  // For references (2-column layout)
  references?: Array<{
    name: string
    title?: string
    organization?: string
    email?: string
    emailSecondary?: string
  }>
  // For government clearances
  clearances?: {
    currentStatus: string
    past: Array<{
      dateRange: string
      level: string
      grantor: string
      holder: string
    }>
  }
}

export interface CVHeaderData {
  name: string
  title?: string
  contactLines: string[]
  links: CVLink[]
  lastUpdated: string
  sourceUrl: string
  logoSrc?: string
}

export interface CVData {
  header: CVHeaderData
  sections: CVSection[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format GPA: 4 -> "4.0", 3.93 -> "3.93" */
export function fmtGpa(n: number): string {
  return Number.isInteger(n) ? n.toFixed(1) : String(n)
}

/** Format a start/end date pair into human-readable range. */
export function formatDateRange(
  start?: string,
  end?: string,
  isCurrent?: boolean,
): string {
  const fmt = (d?: string) => {
    if (!d) return ''
    const [year, month] = d.split('-')
    if (!month) return year
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`
  }
  const s = fmt(start)
  const e = isCurrent ? 'Present' : fmt(end)
  if (!s && !e) return ''
  if (!s) return e
  if (!e) return s
  return `${s} \u2013\n ${e}`
}

/** Format a single date as "Month YYYY" (full month name) or just "YYYY". Returns "N/A" if falsy. */
export function fmtSingleDate(d?: string | null): string {
  if (!d) return 'N/A'
  const [year, month] = d.split('-')
  if (!month) return year
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`
}

const SKILL_LABEL_MAP: Record<string, string> = {
  prog_languages: 'Languages',
  data_languages: 'Data & Markup',
  libraries:      'Libraries & Frameworks',
  dev_tools:      'Development Tools',
  office_tools:   'Office Tools',
  comm_tools:     'Communication Tools',
  cloud:          'Cloud',
  vocabularies:   'Vocabularies & Standards',
  ai_tools:       'AI Tools',
  design:         'Design',
  soft_skills:    'Soft Skills',
  // os excluded intentionally
}

/** Count technology occurrences across all entities — mirrors the landing page skill chip logic. */
export function countTechOccurrences(person: Person): Map<string, number> {
  const counts = new Map<string, number>()
  const bump = (t: string) => counts.set(t, (counts.get(t) ?? 0) + 1)
  const entities = [
    ...(person.projects ?? []),
    ...(person.work_experiences ?? []),
    ...(person.courses ?? []),
    ...(person.extracurriculars ?? []),
    ...(person.publications ?? []),
    ...(person.talks ?? []),
  ] as Array<{ technologies?: string[] }>
  for (const e of entities) for (const t of e.technologies ?? []) bump(t)
  return counts
}

/**
 * Build skill groups directly from occurrence counts + tech-categories lookup.
 * Mirrors the landing page chip logic exactly: same sources, same names, same order.
 * Top 20 per category; OS, soft_skills, personal, paradigms excluded.
 */
export function groupSkills(_skills: Skill[], occurrences: Map<string, number>): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const [tech, category] of Object.entries(TECH_CATEGORIES)) {
    const label = SKILL_LABEL_MAP[category]
    if (!label) continue  // excludes os, soft_skills, personal, paradigms
    if (!groups[label]) groups[label] = []
    groups[label].push(tech)
  }
  for (const label of Object.keys(groups)) {
    groups[label] = groups[label]
      .filter(t => (occurrences.get(t) ?? 0) > 0)  // only skills actually used
      .sort((a, b) => (occurrences.get(b) ?? 0) - (occurrences.get(a) ?? 0))
      .slice(0, 20)
    if (groups[label].length === 0) delete groups[label]
  }
  return groups
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Transform a Person object into the renderer-agnostic CVData model.
 * `buildDate` should be an ISO-ish string (e.g. from __BUILD_DATE__).
 */
export function buildCVData(person: Person, buildDate: string): CVData {
  // ── Header ──────────────────────────────────────────────────────────────
  const linkedin = person.social_links?.find(s => s.platform === 'LinkedIn')
  const github = person.social_links?.find(s => s.platform === 'GitHub')

  const contactLines: string[] = [
    // Line 1: location | phone
    [person.location && `${person.location} \u00B7 Remote`, person.phone]
      .filter(Boolean)
      .join('\u00A0\u00A0|\u00A0\u00A0'),
    // Line 2: emails
    [person.email_personal, person.email_academic]
      .filter(Boolean)
      .join('\u00A0\u00A0|\u00A0\u00A0'),
  ].filter(line => line.length > 0)

  const links: CVLink[] = []
  if (linkedin) links.push({ label: 'LinkedIn', url: `https://linkedin.com/in/${linkedin.handle}` })
  if (github) links.push({ label: 'GitHub', url: `https://github.com/${github.handle}` })
  if (person.website) links.push({ label: person.website.replace('https://', ''), url: person.website })
  const scholar = person.social_links?.find(s => s.platform === 'Google Scholar')
  if (scholar) links.push({ label: 'Google Scholar', url: scholar.url })
  if (person.orcid) links.push({ label: 'ORCID', url: `https://orcid.org/${person.orcid}` })

  const dateStr = new Date(buildDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const lastUpdated = `Last updated ${dateStr}`

  const header: CVHeaderData = {
    name: person.name,
    title: person.title?.replace(/\s*·\s*/g, '\u00A0\u00A0·\u00A0\u00A0'),
    contactLines,
    links,
    lastUpdated,
    sourceUrl: 'https://procko.pro/cv',
  }

  // ── Sections ────────────────────────────────────────────────────────────
  const sections: CVSection[] = []

  // Summary
  if (person.summary) {
    sections.push({ header: 'Summary', text: person.summary.trim() })
  }

  // Education
  if ((person.education?.length ?? 0) > 0) {
    const entries: CVEntry[] = person.education!.map(edu => {
      const notes: Array<{ prefix?: string; text: string; url?: string }> = []

      if (edu.thesis_title) {
        notes.push({
          prefix: `${edu.thesis_label ?? 'Thesis'}: `,
          text: edu.thesis_title,
          url: edu.thesis_url,
        })
      }
      if (edu.thesis_github) {
        notes.push({ prefix: 'GitHub: ', text: edu.thesis_github, url: edu.thesis_github })
      }
      if (edu.advisor) {
        notes.push({ prefix: 'Advisor: ', text: edu.advisor, url: edu.advisor_url })
      }
      if (edu.notes) {
        for (const note of edu.notes) {
          notes.push({ text: note })
        }
      }

      return {
        title: `${edu.degree}${edu.field && edu.field !== edu.degree ? ` in ${edu.field}` : ''}`,
        date: formatDateRange(edu.start_date, edu.end_date),
        subtitle: edu.institution,
        gpa: edu.gpa ? { value: fmtGpa(edu.gpa), max: fmtGpa(edu.gpa_max ?? 4.0) } : undefined,
        notes: notes.length > 0 ? notes : undefined,
      }
    })
    sections.push({ header: 'Education', entries })
  }

  // Work Experience — grouped by work_section
  if ((person.work_experiences?.length ?? 0) > 0) {
    const sectionOrder = [
      'Defense and AI Industry Experience',
      'Defense and AI Research Experience',
      'Applied R&D and Consulting Experience',
      'Graduate Positions',
      'Undergrad and Prior',
    ]
    const grouped = new Map<string, CVEntry[]>()
    for (const sec of sectionOrder) grouped.set(sec, [])

    for (const exp of person.work_experiences!.filter(e => !e.cv_exclude)) {
      const sec = exp.work_section ?? 'Other'
      if (!grouped.has(sec)) grouped.set(sec, [])
      grouped.get(sec)!.push({
        title: exp.title,
        titleSuffix: `${exp.organization}${exp.location ? ` » ${exp.location}` : ''}`,
        date: formatDateRange(exp.start_date, exp.end_date, exp.is_current),
        bullets: exp.description,
      })
    }

    const subsections: CVSubsection[] = []
    for (const [subheader, entries] of grouped) {
      if (entries.length > 0) {
        subsections.push({ subheader, entries })
      }
    }
    sections.push({ header: 'Work Experience', subsections })
  }

  // Publications — all non-in-progress, sorted by date desc
  const allPubs = [...(person.publications ?? [])]
    .filter(p => p.status !== 'in_progress')
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  if (allPubs.length > 0) {
    const awaitingPubs = allPubs.filter(p => p.status === 'awaiting_publication')
    const publishedPubs = allPubs.filter(p => p.status !== 'awaiting_publication')
    let idx = 1
    const pubGroups = []
    if (awaitingPubs.length > 0) {
      pubGroups.push({
        subheader: 'Awaiting Publication',
        items: awaitingPubs.map(pub => ({
          index: idx++,
          title: pub.title,
          authors: pub.authors?.join(', ') ?? '',
          venue: pub.venue ?? '',
          date: fmtSingleDate(pub.date),
          url: pub.url,
        })),
      })
    }
    if (publishedPubs.length > 0) {
      pubGroups.push({
        subheader: awaitingPubs.length > 0 ? 'Published' : undefined,
        items: publishedPubs.map(pub => ({
          index: idx++,
          title: pub.title,
          authors: pub.authors?.join(', ') ?? '',
          venue: pub.venue ?? '',
          date: fmtSingleDate(pub.date),
          url: pub.url,
        })),
      })
    }
    sections.push({
      header: 'Publications',
      headerLinks: scholar?.url ? [{ label: 'Google Scholar', url: scholar.url }] : undefined,
      pubGroups,
    })
  }

  // Projects (top 8, featured first, then by year desc)
  const topProjects = [...(person.projects ?? [])]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return (b.year ?? '').localeCompare(a.year ?? '')
    })
    .slice(0, 8)

  if (topProjects.length > 0) {
    const entries: CVEntry[] = topProjects.map(proj => {
      const titleLinks: Array<{ label: string; url: string }> = []
      if (proj.repo_url) titleLinks.push({ label: 'GitHub', url: proj.repo_url })
      const liveUrl = proj.url && proj.url !== proj.repo_url && !proj.url.includes('github.com') ? proj.url : undefined
      if (liveUrl) titleLinks.push({ label: 'Live', url: liveUrl })
      const notes: Array<{ text: string }> = []
      if (proj.description) notes.push({ text: proj.description })
      return {
        title: proj.title,
        date: fmtSingleDate(proj.year),
        notes: notes.length > 0 ? notes : undefined,
        titleLinks: titleLinks.length > 0 ? titleLinks : undefined,
      }
    })
    sections.push({
      header: 'Projects (Top 8)',
      headerLinks: github?.url ? [{ label: 'GitHub', url: github.url }] : undefined,
      entries,
    })
  }

  // Skills
  const skillGrps = groupSkills(person.skills ?? [], countTechOccurrences(person))
  if (Object.keys(skillGrps).length > 0) {
    sections.push({ header: 'Skills', skillGroups: skillGrps })
  }

  // Awards (exclude about_only entries)
  const cvAwards = (person.awards ?? []).filter(a => !a.about_only)
  if (cvAwards.length > 0) {
    const entries: CVEntry[] = cvAwards.map(award => ({
      title: award.title,
      titleSuffix: award.issuer,
      date: fmtSingleDate(award.date),
    }))
    sections.push({ header: 'Awards & Honors', entries })
  }

  // Talks
  if ((person.talks?.length ?? 0) > 0) {
    const entries: CVEntry[] = person.talks!.map(talk => ({
      title: talk.title,
      titleUrl: talk.url,
      titleSuffix: talk.venue,
      date: fmtSingleDate(talk.date),
    }))
    sections.push({ header: 'Talks & Podcasts', entries })
  }

  // Certifications
  if ((person.certificates?.length ?? 0) > 0) {
    const entries: CVEntry[] = person.certificates!.map(cert => ({
      title: cert.title,
      titleSuffix: [
        cert.issuer,
        cert.status === 'in_progress' ? '[In Progress]' : null,
      ].filter(Boolean).join(' ') || undefined,
      date: fmtSingleDate(cert.date),
    }))
    sections.push({ header: 'Certifications', entries })
  }

  // Extracurriculars — grouped by type
  const extras = person.extracurriculars ?? []
  if (extras.length > 0) {
    const extraDate = (e: typeof extras[0]) =>
      e.start_date
        ? formatDateRange(e.start_date, e.end_date, e.is_current)
        : fmtSingleDate(e.date)

    const makeEntries = (items: typeof extras): CVEntry[] =>
      items.map(e => {
        const isReview = e.title === 'Manuscript reviews'
        return {
          title: e.title,
          titleUrl: !isReview && e.url ? e.url : undefined,
          titleSuffix: !isReview && e.organization ? e.organization : undefined,
          date: extraDate(e),
          bullets: e.bullets,
        }
      })

    const scholarly = extras.filter((e: any) => e.type === 'scholarly')
    const orgs      = extras.filter((e: any) => e.type === 'organization')
    const volunteer = extras.filter((e: any) => e.type === 'volunteer')

    const subsections: CVSubsection[] = []
    if (scholarly.length > 0) subsections.push({ subheader: 'Scholarly Contributions', entries: makeEntries(scholarly) })
    if (orgs.length > 0)      subsections.push({ subheader: 'Organizations', entries: makeEntries(orgs) })
    if (volunteer.length > 0) subsections.push({ subheader: 'Service & Volunteer', entries: makeEntries(volunteer) })

    if (subsections.length > 0) sections.push({ header: 'Extracurriculars', subsections })
  }

  // Security Clearance
  if (person.clearance || (person.past_clearances?.length ?? 0) > 0) {
    sections.push({
      header: 'Government Clearances',
      clearances: {
        currentStatus: person.clearance ?? '',
        past: (person.past_clearances ?? []).map(c => ({
          dateRange: c.date_range,
          level: c.level,
          grantor: c.grantor,
          holder: c.holder,
        })),
      },
    })
  }

  // References
  if ((person.references?.length ?? 0) > 0) {
    sections.push({
      header: 'References',
      references: person.references!.map(ref => ({
        name: ref.name,
        title: ref.title,
        organization: ref.organization,
        email: ref.email,
        emailSecondary: ref.email_secondary,
      })),
    })
  }

  return { header, sections }
}

/**
 * Transform a Person object into the renderer-agnostic CVData model for a resume.
 * Includes: Summary, Work Experience, Projects, Technical Skills, Security Clearance.
 */
export function buildResumeData(person: Person, buildDate: string): CVData {
  const linkedin = person.social_links?.find(s => s.platform === 'LinkedIn')
  const github = person.social_links?.find(s => s.platform === 'GitHub')
  const scholar = person.social_links?.find(s => s.platform === 'Google Scholar')

  const header: CVHeaderData = {
    name: person.name,
    title: person.title?.replace(/\s*·\s*/g, '\u00A0\u00A0·\u00A0\u00A0'),
    contactLines: [
      [person.location && `${person.location} \u00B7 Remote`, person.phone].filter(Boolean).join('\u00A0\u00A0|\u00A0\u00A0'),
      [person.email_personal, person.email_academic].filter(Boolean).join('\u00A0\u00A0|\u00A0\u00A0'),
    ].filter(Boolean),
    links: [
      linkedin && { label: 'LinkedIn', url: `https://linkedin.com/in/${linkedin.handle}` },
      github && { label: 'GitHub', url: `https://github.com/${github.handle}` },
      person.website && { label: person.website.replace('https://', ''), url: person.website },
      scholar && { label: 'Google Scholar', url: scholar.url },
    ].filter(Boolean) as CVLink[],
    lastUpdated: `Last updated ${new Date(buildDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    sourceUrl: 'https://procko.pro/resume',
  }

  const sections: CVSection[] = []

  // Summary
  if (person.summary) {
    sections.push({ header: 'Summary', text: person.summary.trim() })
  }

  // Education (consolidated ERAU only — no dates)
  const phd = person.education?.find(e => e.id === 'edu/phd-erau')
  const ms  = person.education?.find(e => e.id === 'edu/ms-erau')
  const bs  = person.education?.find(e => e.id === 'edu/bs-erau')
  if (phd || ms || bs) {
    const notes: CVEntry['notes'] = []
    if (phd) {
      notes.push({
        prefix: 'Ph.D., CS & Electrical Engineering — Dissertation: ',
        text: phd.thesis_title ?? '',
        url: phd.thesis_url,
      })
      if (phd.thesis_github) notes.push({
        prefix: 'GitHub: ',
        text: phd.thesis_github.replace('https://', ''),
        url: phd.thesis_github,
        indent: true,
      })
    }
    if (ms) {
      notes.push({
        prefix: 'M.S., Software Engineering — Thesis: ',
        text: ms.thesis_title ?? '',
        url: ms.thesis_url,
      })
    }
    if (bs) {
      notes.push({
        text: 'B.S., Software Engineering — Summa Cum Laude · Minor: Cybersecurity Engineering',
      })
    }
    sections.push({
      header: 'Education',
      entries: [{
        title: 'Embry-Riddle Aeronautical University (ERAU)',
        titleSuffix: 'Daytona Beach, FL',
        notes,
        fullWidth: true,
      }],
    })
  }

  // Work Experience (exclude resume_exclude entries)
  const resumeExps = (person.work_experiences ?? []).filter(exp => !exp.resume_exclude)
  if (resumeExps.length > 0) {
    const entries: CVEntry[] = resumeExps.map(exp => ({
      title: exp.title,
      titleSuffix: exp.location ? `${exp.organization} » ${exp.location}` : exp.organization,
      date: formatDateRange(exp.start_date, exp.end_date, exp.is_current),
      bullets: Array.isArray(exp.description) ? exp.description : exp.description ? [exp.description] : undefined,
    }))
    sections.push({ header: 'Work Experience', entries })
  }

  // Projects (top 8)
  const projects = [...(person.projects ?? [])]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return (b.year ?? '').localeCompare(a.year ?? '')
    })
    .slice(0, 8)
  if (projects.length > 0) {
    const entries: CVEntry[] = projects.map(proj => {
      const titleLinks: Array<{ label: string; url: string }> = []
      if (proj.repo_url) titleLinks.push({ label: 'GitHub', url: proj.repo_url })
      if (proj.url) titleLinks.push({ label: 'Live', url: proj.url })
      const notes: Array<{ prefix?: string; text: string; url?: string }> = []
      if (proj.description) notes.push({ text: proj.description })
      return {
        title: proj.title,
        date: fmtSingleDate(proj.year),
        notes: notes.length > 0 ? notes : undefined,
        titleLinks: titleLinks.length > 0 ? titleLinks : undefined,
      }
    })
    sections.push({
      header: 'Projects',
      headerLinks: github?.url ? [{ label: 'GitHub', url: github.url }] : undefined,
      entries,
    })
  }

  // Publications — condensed summary for resume
  const resumePubs = [...(person.publications ?? [])].filter(p => p.status !== 'in_progress')
  if (resumePubs.length > 0) {
    const domainCounts: Record<string, number> = {}
    for (const p of resumePubs) for (const d of p.domains ?? []) domainCounts[d] = (domainCounts[d] ?? 0) + 1
    const topTopics = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([d]) => d)
    let pubSummary = `${resumePubs.length} peer-reviewed publications`
    if (topTopics.length > 0) pubSummary += ` · ${topTopics.join(', ')}`
    const scholarEntry: CVEntry = {
      title: pubSummary,
      fullWidth: true,
      ...(scholar?.url ? { titleLinks: [{ label: 'Google Scholar', url: scholar.url }] } : {}),
    }
    sections.push({
      header: 'Publications',
      headerLinks: scholar?.url ? [{ label: 'Google Scholar', url: scholar.url }] : undefined,
      entries: [scholarEntry],
    })
  }

  // Technical Skills
  const skillGroups = groupSkills(person.skills ?? [], countTechOccurrences(person))
  if (Object.keys(skillGroups).length > 0) {
    sections.push({ header: 'Technical Skills', skillGroups })
  }

  // Security Clearance
  if (person.clearance) {
    sections.push({ header: 'Government Clearances', text: person.clearance })
  }

  return { header, sections }
}
