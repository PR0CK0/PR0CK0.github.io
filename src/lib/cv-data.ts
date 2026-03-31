import type { Person, Skill } from '@/lib/schema'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CVLink {
  label: string
  url: string
}

export interface CVEntry {
  title: string           // bold text
  titleSuffix?: string    // italic text after title (org, location)
  date?: string           // right column
  subtitle?: string       // line below title (institution)
  gpa?: { value: string; max: string }  // GPA with bold value
  notes?: Array<{ text: string; url?: string }>  // bullet notes with optional links
  bullets?: string[]      // description bullets
}

export interface CVSubsection {
  subheader: string
  description?: string  // intro paragraph for the subsection
  entries: CVEntry[]
}

export interface CVSection {
  header: string
  entries?: CVEntry[]
  subsections?: CVSubsection[]
  // For skills section
  skillGroups?: Record<string, string[]>
  // For simple text sections
  text?: string
  // For publications (different format)
  publications?: Array<{
    index: number
    title: string
    authors: string
    venue: string
    date: string
    url?: string
  }>
}

export interface CVHeaderData {
  name: string
  title?: string
  contactLines: string[]
  links: CVLink[]
  lastUpdated: string
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
  return `${s} \u2013 ${e}`
}

/** Group flat skill list into labelled categories. */
export function groupSkills(skills: Skill[]): Record<string, string[]> {
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
      .join('  |  '),
    // Line 2: emails
    [person.email_personal, person.email_academic]
      .filter(Boolean)
      .join('  |  '),
  ].filter(line => line.length > 0)

  const links: CVLink[] = []
  if (linkedin) links.push({ label: 'LinkedIn', url: `https://linkedin.com/in/${linkedin.handle}` })
  if (github) links.push({ label: 'GitHub', url: `https://github.com/${github.handle}` })
  if (person.website) links.push({ label: person.website.replace('https://', ''), url: person.website })
  const scholar = person.social_links?.find(s => s.platform === 'Google Scholar')
  if (scholar) links.push({ label: 'Google Scholar', url: scholar.url })
  if (person.orcid) links.push({ label: 'ORCID', url: `https://orcid.org/${person.orcid}` })

  const lastUpdated = new Date(buildDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const header: CVHeaderData = {
    name: person.name,
    title: person.title?.replace(/\s*·\s*/g, '\u00A0\u00A0·\u00A0\u00A0'),
    contactLines,
    links,
    lastUpdated,
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
      const notes: Array<{ text: string; url?: string }> = []

      if (edu.thesis_title) {
        notes.push({
          text: `${edu.thesis_label ?? 'Thesis'}: ${edu.thesis_title}`,
          url: edu.thesis_url,
        })
      }
      if (edu.thesis_github) {
        notes.push({ text: `GitHub: ${edu.thesis_github}`, url: edu.thesis_github })
      }
      if (edu.advisor) {
        notes.push({ text: `Advisor: ${edu.advisor}`, url: edu.advisor_url })
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

    for (const exp of person.work_experiences!) {
      const sec = exp.work_section ?? 'Other'
      if (!grouped.has(sec)) grouped.set(sec, [])
      grouped.get(sec)!.push({
        title: exp.title,
        titleSuffix: `${exp.organization}${exp.location ? `, ${exp.location}` : ''}`,
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

  // Publications (top 10, published, sorted by date desc)
  const topPubs = [...(person.publications ?? [])]
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 10)

  if (topPubs.length > 0) {
    sections.push({
      header: 'Selected Publications (Top 10, Published)',
      publications: topPubs.map((pub, i) => ({
        index: i + 1,
        title: pub.title,
        authors: pub.authors?.join(', ') ?? '',
        venue: pub.venue ?? '',
        date: pub.date ?? '',
        url: pub.url,
      })),
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
      const notes: Array<{ text: string; url?: string }> = []
      if (proj.technologies && proj.technologies.length > 0) {
        notes.push({ text: `Tech: ${proj.technologies.join(', ')}` })
      }
      if (proj.url || proj.repo_url) {
        notes.push({ text: proj.url ?? proj.repo_url!, url: proj.url ?? proj.repo_url })
      }
      return {
        title: proj.title,
        date: proj.year,
        subtitle: proj.description,
        notes: notes.length > 0 ? notes : undefined,
      }
    })
    sections.push({ header: 'Projects (Top 8)', entries })
  }

  // Skills
  const skillGrps = groupSkills(person.skills ?? [])
  if (Object.keys(skillGrps).length > 0) {
    sections.push({ header: 'Skills', skillGroups: skillGrps })
  }

  // Awards
  if ((person.awards?.length ?? 0) > 0) {
    const entries: CVEntry[] = person.awards!.map(award => ({
      title: award.title,
      titleSuffix: award.issuer,
      date: award.date ? `(${award.date})` : undefined,
    }))
    sections.push({ header: 'Awards & Honors', entries })
  }

  // Certifications
  if ((person.certificates?.length ?? 0) > 0) {
    const entries: CVEntry[] = person.certificates!.map(cert => ({
      title: cert.title,
      titleSuffix: [
        cert.issuer,
        cert.date ? `(${cert.date})` : null,
        cert.status === 'in_progress' ? '[In Progress]' : null,
      ].filter(Boolean).join(' ') || undefined,
    }))
    sections.push({ header: 'Certifications', entries })
  }

  // Security Clearance
  if (person.clearance) {
    sections.push({ header: 'Security Clearance', text: person.clearance })
  }

  return { header, sections }
}

// ─── Resume Builder ──────────────────────────────────────────────────────────

const TECHNICAL_CATEGORIES = new Set([
  'prog_languages', 'data_languages', 'libraries', 'dev_tools', 'office_tools',
  'comm_tools', 'cloud', 'vocabularies', 'ai_tools', 'design', 'os',
])

const TECH_CATEGORY_LABELS: Record<string, string> = {
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

export function groupTechnicalSkills(skills: Skill[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const sk of skills) {
    if (!TECHNICAL_CATEGORIES.has(sk.category)) continue
    const label = TECH_CATEGORY_LABELS[sk.category] ?? sk.category
    if (!groups[label]) groups[label] = []
    groups[label].push(sk.name)
  }
  return groups
}

/**
 * Transform a Person object into the renderer-agnostic CVData model for a resume.
 * Includes: Summary, Work Experience, Projects, Technical Skills, Security Clearance.
 */
export function buildResumeData(person: Person, buildDate: string): CVData {
  const linkedin = person.social_links?.find(s => s.platform === 'LinkedIn')
  const github = person.social_links?.find(s => s.platform === 'GitHub')

  const header: CVHeaderData = {
    name: person.name,
    title: person.title?.replace(/\s*·\s*/g, '\u00A0\u00A0·\u00A0\u00A0'),
    contactLines: [
      [person.location && `${person.location} \u00B7 Remote`, person.phone].filter(Boolean).join('  |  '),
      [person.email_personal, person.email_academic].filter(Boolean).join('  |  '),
    ].filter(Boolean),
    links: [
      linkedin && { label: 'LinkedIn', url: `https://linkedin.com/in/${linkedin.handle}` },
      github && { label: 'GitHub', url: `https://github.com/${github.handle}` },
      person.website && { label: person.website.replace('https://', ''), url: person.website },
    ].filter(Boolean) as CVLink[],
    lastUpdated: new Date(buildDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }

  const sections: CVSection[] = []

  // Summary
  if (person.summary) {
    sections.push({ header: 'Summary', text: person.summary.trim() })
  }

  // Work Experience
  if ((person.work_experiences?.length ?? 0) > 0) {
    const entries: CVEntry[] = person.work_experiences!.map(exp => ({
      title: exp.title,
      titleSuffix: [exp.organization, exp.location].filter(Boolean).join(', ') || undefined,
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
      const notes: Array<{ text: string; url?: string }> = []
      if (proj.description) notes.push({ text: proj.description })
      if (proj.technologies?.length) notes.push({ text: `Tech: ${proj.technologies.join(', ')}` })
      if (proj.url || proj.repo_url) notes.push({ text: proj.url ?? proj.repo_url ?? '', url: proj.url ?? proj.repo_url ?? '' })
      return { title: proj.title, date: proj.year, notes }
    })
    sections.push({ header: 'Projects', entries })
  }

  // Technical Skills
  const skillGroups = groupTechnicalSkills(person.skills ?? [])
  if (Object.keys(skillGroups).length > 0) {
    sections.push({ header: 'Technical Skills', skillGroups })
  }

  // Security Clearance
  if (person.clearance) {
    sections.push({ header: 'Security Clearance', text: person.clearance })
  }

  return { header, sections }
}
