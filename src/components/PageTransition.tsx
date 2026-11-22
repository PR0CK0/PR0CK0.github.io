import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import './PageTransition.css'

const DURATION_MS = 900

export default function PageTransition({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transition, setTransition] = useState<string | null>(null)
  const [bounds, setBounds] = useState<CSSProperties>({})
  const commandRef = useRef<HTMLSpanElement>(null)
  const command = `cd ~/${location.pathname.slice(1) || 'home'}`

  useEffect(() => {
    const element = commandRef.current
    if (element) element.style.setProperty('--command-width', `${element.scrollWidth}px`)
  }, [transition, command])

  useEffect(() => {
    const changed = previousPath.current !== location.pathname
    previousPath.current = location.pathname
    if (!changed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayLocation(location)
      setTransition(null)
      return
    }
    const main = document.querySelector('main')!
    const rect = main.getBoundingClientRect()
    const footer = main.querySelector('footer')?.getBoundingClientRect()
    const bottom = footer && footer.top < rect.bottom && footer.bottom > rect.top
      ? Math.max(rect.top, footer.top) : rect.bottom
    setBounds({ top: rect.top, left: rect.left, width: rect.width, height: bottom - rect.top })
    setTransition(location.key)
    let frame = 0
    const finish = window.setTimeout(() => {
      setTransition(null)
      // Let the terminal disappear before mounting the destination.
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => setDisplayLocation(location))
      })
    }, DURATION_MS)
    return () => {
      window.clearTimeout(finish)
      window.cancelAnimationFrame(frame)
    }
  }, [location])

  // Unmount the graph immediately on navigation, terminating pending layout work.
  const leavingGraph = displayLocation.pathname === '/graph' && location.pathname !== displayLocation.pathname

  return <>
    {!leavingGraph && children(displayLocation)}
    {transition !== null && <div key={transition} data-page-transition aria-hidden="true"
      className="page-transition" style={{ ...bounds, '--transition-duration': `${DURATION_MS}ms` } as CSSProperties}>
      <div className="page-transition-terminal">
        <div className="page-transition-title"><span>procko.pro</span><span className="page-transition-marks">▪ ▪ ▪</span></div>
        <div className="page-transition-prompt">
          <span className="page-transition-chevron">❯</span>
          <span ref={commandRef} className="page-transition-command" style={{ '--command-steps': command.length } as CSSProperties}>{command}</span>
          <span className="page-transition-cursor">▮</span>
        </div>
        <div className="page-transition-track"><span /></div>
      </div>
    </div>}
  </>
}
