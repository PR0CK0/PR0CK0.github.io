import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'
import { z } from 'zod'
import { PublicationSchema } from '../schema'

it('accepts the publication classifications used in the portfolio', () => {
  const data = load(readFileSync('public/data/tyler-procko.yaml', 'utf8')) as { publications: unknown[] }
  const result = z.array(PublicationSchema).safeParse(data.publications)
  expect(result.success, JSON.stringify(result.error?.issues)).toBe(true)
})

it('still rejects unrecognized publication statuses', () => {
  const result = PublicationSchema.safeParse({ id: 'publication/test', title: 'Example', status: 'pubished' })
  expect(result.success).toBe(false)
  expect(result.error?.issues[0].path).toEqual(['status'])
})
