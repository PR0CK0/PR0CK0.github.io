// Mirrors data/schema/portfolio.linkml.yaml

export interface SocialLink {
  id: string
  platform: string
  url: string
  handle: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  start_date: string
  end_date?: string
  gpa?: string
  distinction?: boolean
  notes?: string[]
}

export interface WorkExperience {
  id: string
  title: string
  organization: string
  start_date: string
  end_date?: string
  is_current?: boolean
  location?: string
  description?: string[]
  technologies?: string[]
}

export interface Publication {
  id: string
  title: string
  authors?: string[]
  venue?: string
  date?: string
  status?: 'published' | 'awaiting_publication' | 'in_progress'
  doi?: string
  url?: string
  abstract?: string
  tags?: string[]
}

export interface Project {
  id: string
  title: string
  description?: string
  year?: number
  technologies?: string[]
  url?: string
  repo_url?: string
  featured?: boolean
  tags?: string[]
}

export interface Skill {
  id: string
  name: string
  category?: string
  years_experience?: number
  proficiency?: 'expert' | 'advanced' | 'intermediate' | 'familiar'
}

export interface Award {
  id: string
  title: string
  issuer?: string
  date?: string
  description?: string
}

export interface Certificate {
  id: string
  title: string
  issuer?: string
  date?: string
  status?: 'completed' | 'in_progress'
  url?: string
}

export interface Talk {
  id: string
  title: string
  venue?: string
  date?: string
  url?: string
  description?: string
}

export interface Reference {
  id: string
  name: string
  title?: string
  organization?: string
  email?: string
  phone?: string
  relationship?: string
}

export interface Extracurricular {
  id: string
  title: string
  organization?: string
  role?: string
  description?: string
  date?: string
}

export interface Person {
  id: string
  name: string
  title?: string
  location?: string
  phone?: string
  email_personal?: string
  email_academic?: string
  orcid?: string
  website?: string
  tagline?: string
  summary?: string
  clearance?: string
  availability?: string
  birth_year?: number
  mbti?: string
  social_links?: SocialLink[]
  education?: Education[]
  work_experiences?: WorkExperience[]
  publications?: Publication[]
  projects?: Project[]
  skills?: Skill[]
  awards?: Award[]
  certificates?: Certificate[]
  talks?: Talk[]
  references?: Reference[]
  extracurriculars?: Extracurricular[]
  books_read?: string[]
  hobbies?: string[]
  favorite_artists?: string[]
  favorite_music?: string[]
}
