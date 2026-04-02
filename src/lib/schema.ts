import { z } from 'zod'

export const SocialLinkSchema = z.object({
  id: z.string(),
  platform: z.string(),
  url: z.string(),
  handle: z.string().optional(),
})

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  gpa: z.number().optional(),
  gpa_max: z.number().optional(),
  distinction: z.boolean().optional(),
  notes: z.array(z.string()).optional(),
  thesis_label: z.string().optional(),
  thesis_title: z.string().optional(),
  thesis_url: z.string().optional(),
  thesis_github: z.string().optional(),
  advisor: z.string().optional(),
  advisor_url: z.string().optional(),
})

export const WorkExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string(),
  work_section: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
  location: z.string().optional(),
  description: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  personal_skills: z.array(z.string()).optional(),
  resume_exclude: z.boolean().optional(),
  cv_exclude: z.boolean().optional(),
  graph_exclude: z.boolean().optional(),
})

export const PublicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  venue: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['published', 'awaiting_publication', 'in_progress']).optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  abstract: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  personal_skills: z.array(z.string()).optional(),
})

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  year: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  personal_skills: z.array(z.string()).optional(),
  url: z.string().optional(),
  repo_url: z.string().optional(),
  featured: z.boolean().optional(),
})

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['prog_languages', 'data_languages', 'libraries', 'dev_tools', 'office_tools', 'comm_tools', 'cloud', 'vocabularies', 'ai_tools', 'design', 'os', 'soft_skills', 'personal', 'paradigms']),
  years_experience: z.number().optional(),
})

export const AwardSchema = z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  about_only: z.boolean().optional(),
})

export const CertificateSchema = z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['completed', 'in_progress']).optional(),
  deprecated: z.boolean().optional(),
  url: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
})

export const TalkSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string().optional(),
  date: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  personal_skills: z.array(z.string()).optional(),
})

export const AssociateSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().optional(),
  organization: z.string().optional(),
  relationship: z.string().optional(),
  social_links: z.array(SocialLinkSchema).optional(),
})

export const ReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().optional(),
  organization: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
})

export const CourseSchema = z.object({
  number: z.string(),
  name: z.string(),
  technologies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  personal_skills: z.array(z.string()).optional(),
})

export const ExtracurricularSchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string().optional(),
  role: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  personal_skills: z.array(z.string()).optional(),
})

export const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email_personal: z.string().optional(),
  email_academic: z.string().optional(),
  orcid: z.string().optional(),
  website: z.string().optional(),
  tagline: z.string().optional(),
  summary: z.string().optional(),
  clearance: z.string().optional(),
  availability: z.string().optional(),
  birth_year: z.number().optional(),
  mbti: z.string().optional(),
  social_links: z.array(SocialLinkSchema).optional(),
  education: z.array(EducationSchema).optional(),
  work_experiences: z.array(WorkExperienceSchema).optional(),
  publications: z.array(PublicationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  skills: z.array(SkillSchema).optional(),
  awards: z.array(AwardSchema).optional(),
  certificates: z.array(CertificateSchema).optional(),
  talks: z.array(TalkSchema).optional(),
  associates: z.array(AssociateSchema).optional(),
  references: z.array(ReferenceSchema).optional(),
  extracurriculars: z.array(ExtracurricularSchema).optional(),
  courses: z.array(CourseSchema).optional(),
  books_read: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  favorite_artists: z.array(z.string()).optional(),
  favorite_music: z.array(z.string()).optional(),
  favorite_books: z.array(z.string()).optional(),
  favorite_show: z.string().optional(),
})

export type Person = z.infer<typeof PersonSchema>
export type Education = z.infer<typeof EducationSchema>
export type WorkExperience = z.infer<typeof WorkExperienceSchema>
export type Publication = z.infer<typeof PublicationSchema>
export type Project = z.infer<typeof ProjectSchema>
export type Skill = z.infer<typeof SkillSchema>
export type Award = z.infer<typeof AwardSchema>
export type Certificate = z.infer<typeof CertificateSchema>
export type Talk = z.infer<typeof TalkSchema>
export type Associate = z.infer<typeof AssociateSchema>
export type Reference = z.infer<typeof ReferenceSchema>
export type Extracurricular = z.infer<typeof ExtracurricularSchema>
export type Course = z.infer<typeof CourseSchema>
export type SocialLink = z.infer<typeof SocialLinkSchema>
