import yaml from 'js-yaml'
import { PersonSchema, type Person } from './schema'

let cachedPerson: Person | null = null

export async function loadPortfolioData(signal?: AbortSignal): Promise<Person> {
  signal?.throwIfAborted()
  if (cachedPerson) return cachedPerson

  const response = await fetch(`/data/tyler-procko.yaml?v=${__GIT_COMMIT__}`, { signal })
  if (!response.ok) {
    throw new Error(`Failed to load portfolio data: ${response.statusText}`)
  }
  const text = await response.text()
  signal?.throwIfAborted()
  try {
    cachedPerson = PersonSchema.parse(yaml.load(text))
  } catch (error) {
    console.error('Portfolio data validation failed:', error)
    throw new Error('Portfolio data is invalid. Please try again later.')
  }

  return cachedPerson
}
