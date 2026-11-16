import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'
import { buildResumeData } from '../cv-data'
import { CertificateSchema, PersonSchema } from '../schema'

it('preserves the portfolio certificate exclusions through parsing and resume generation', () => {
  const data = load(readFileSync('public/data/tyler-procko.yaml', 'utf8')) as {
    certificates: Array<{ id: string; title: string; resume_exclude?: boolean }>
  }
  expect(data.certificates.some(certificate => certificate.resume_exclude)).toBe(true)
  const person = PersonSchema.parse({ id: 'person/test', name: 'Test', certificates: data.certificates })
  const resume = buildResumeData(person, '2026-11-16')
  const titles = resume.sections.find(section => section.header === 'Certifications')?.entries?.map(entry => entry.title)
  expect(titles).toEqual(data.certificates.filter(certificate => !certificate.resume_exclude).map(certificate => certificate.title))
})

it('rejects a non-boolean certificate exclusion flag', () => {
  const result = CertificateSchema.safeParse({ id: 'certificate/test', title: 'Example', resume_exclude: 'true' })
  expect(result.success).toBe(false)
  expect(result.error?.issues[0].path).toEqual(['resume_exclude'])
})
