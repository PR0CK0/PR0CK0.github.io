export type CompetencyCategory =
  | 'prog_languages'
  | 'data_languages'
  | 'libraries'
  | 'dev_tools'
  | 'office_tools'
  | 'comm_tools'
  | 'ai_tools'
  | 'vocabularies'
  | 'cloud'
  | 'os'
  | 'design'
  | 'soft_skills'
  | 'personal'
  | 'domains'

export const COMPETENCY_CATEGORY_LABELS: Record<CompetencyCategory, string> = {
  prog_languages: 'Programming Languages',
  data_languages: 'Data Languages',
  libraries:      'Libraries & Frameworks',
  dev_tools:      'Development Tools',
  office_tools:   'Office Tools',
  comm_tools:     'Communication Tools',
  ai_tools:       'AI Tools',
  vocabularies:   'Ontologies, Vocabularies & Standards',
  cloud:          'Cloud & Deployment',
  os:             'Operating Systems',
  design:         'Design & Analysis Tools',
  soft_skills:    'Soft Skills',
  personal:       'Personal',
  domains:        'Research Domains',
}
