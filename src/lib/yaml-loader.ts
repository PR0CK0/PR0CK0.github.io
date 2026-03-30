import yaml from 'js-yaml'
import { PersonSchema, type Person } from './schema'

let cachedPerson: Person | null = null

export async function loadPortfolioData(): Promise<Person> {
  if (cachedPerson) return cachedPerson

  const response = await fetch(`/data/tyler-procko.yaml?v=${__GIT_COMMIT__}`)
  if (!response.ok) {
    throw new Error(`Failed to load portfolio data: ${response.statusText}`)
  }
  const text = await response.text()
  const raw = yaml.load(text)
  const parsed = PersonSchema.safeParse(raw)

  if (!parsed.success) {
    console.warn('Portfolio data validation warnings:', parsed.error.issues)
    cachedPerson = raw as Person
  } else {
    cachedPerson = parsed.data
  }

  return cachedPerson
}
