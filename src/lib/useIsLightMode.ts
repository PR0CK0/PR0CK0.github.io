import { useState, useEffect } from 'react'

export function useIsLightMode(): boolean {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.classList.contains('light')
  )
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsLight(document.documentElement.classList.contains('light'))
    )
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}
