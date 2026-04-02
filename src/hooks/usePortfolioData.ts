import { useState, useEffect } from 'react'
import yaml from 'js-yaml'
import type { Person } from '../types'

interface PortfolioDataState {
  person: Person | null
  loading: boolean
  error: string | null
}

export function usePortfolioData(): PortfolioDataState {
  const [state, setState] = useState<PortfolioDataState>({
    person: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    fetch('/data/tyler-procko.yaml')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        const person = yaml.load(text) as Person
        setState({ person, loading: false, error: null })
      })
      .catch((err) => {
        setState({ person: null, loading: false, error: err.message })
      })
  }, [])

  return state
}
