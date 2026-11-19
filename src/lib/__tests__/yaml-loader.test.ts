import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PersonSchema } from '../schema'

const validYaml = readFileSync('public/data/tyler-procko.yaml', 'utf8')
const invalidMessage = 'Portfolio data is invalid. Please try again later.'

beforeEach(() => {
  vi.resetModules()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('rejects invalid records with a readable error and logs validation details', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('id: person/test\nname: 123')))
  const { loadPortfolioData } = await import('../yaml-loader')
  await expect(loadPortfolioData()).rejects.toThrow(invalidMessage)
  expect(console.error).toHaveBeenCalledWith('Portfolio data validation failed:', expect.objectContaining({
    issues: expect.arrayContaining([expect.objectContaining({ path: ['name'] })]),
  }))
})

it('rejects malformed YAML with the same readable error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('name: [unterminated')))
  const { loadPortfolioData } = await import('../yaml-loader')
  await expect(loadPortfolioData()).rejects.toThrow(invalidMessage)
})

it('does not cache invalid data and caches a subsequent valid response', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('id: person/test\nname: 123'))
    .mockResolvedValueOnce(new Response(validYaml))
  vi.stubGlobal('fetch', fetchMock)
  const { loadPortfolioData } = await import('../yaml-loader')
  await expect(loadPortfolioData()).rejects.toThrow(invalidMessage)
  const person = await loadPortfolioData()
  expect(person).toEqual(PersonSchema.parse(load(validYaml)))
  expect(await loadPortfolioData()).toBe(person)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('rejects an unsuccessful HTTP response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503, statusText: 'Service Unavailable' })))
  const { loadPortfolioData } = await import('../yaml-loader')
  await expect(loadPortfolioData()).rejects.toThrow('Failed to load portfolio data: Service Unavailable')
})
