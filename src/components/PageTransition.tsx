import { Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { matchPath, useLocation, type Location } from 'react-router-dom'
import { LOADING_SCREEN } from '@/lib/ui-constants'
import './PageTransition.css'

const COVER_MS = 160
const COMMAND_MS = 900
const REVEAL_MS = 240

function PageContent({ locationKey, onReady, children }: {
  locationKey: string
  onReady: (key: string) => void
  children: ReactNode
}) {
  useEffect(() => onReady(locationKey), [locationKey, onReady])
  return <>{children}</>
}

export default function PageTransition({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transition, setTransition] = useState<string | null>(null)
  const [commandDone, setCommandDone] = useState(false)
  const [readyKey, setReadyKey] = useState(location.key)
  const [bounds, setBounds] = useState<CSSProperties>({})
  const commandRef = useRef<HTMLSpanElement>(null)
  const command = `cd ~/${location.pathname.slice(1) || 'home'}`
  const revealing = transition === location.key && commandDone && readyKey === location.key

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
    setCommandDone(false)
    // Finish typing before mounting heavy pages, with the terminal still opaque.
    const finish = window.setTimeout(() => {
      setDisplayLocation(location)
      setCommandDone(true)
    }, COMMAND_MS)
    return () => window.clearTimeout(finish)
  }, [location])

  useEffect(() => {
    if (!revealing) return
    const finish = window.setTimeout(() => setTransition(null), REVEAL_MS)
    return () => window.clearTimeout(finish)
  }, [revealing, location.key])

  // Unmount the graph immediately on navigation, terminating pending layout work.
  const leavingGraph = matchPath('/graph', displayLocation.pathname) !== null && location.pathname !== displayLocation.pathname

  return <>
    <Suspense fallback={<div className={LOADING_SCREEN} role="status"><span className="sr-only">Loading</span></div>}>
      {!leavingGraph && <PageContent locationKey={displayLocation.key} onReady={setReadyKey}>
        {children(displayLocation)}
      </PageContent>}
    </Suspense>
    {transition !== null && <div key={transition} data-page-transition aria-hidden="true"
      className={`page-transition${revealing ? ' page-transition-reveal' : ''}`}
      style={{ ...bounds, '--cover-duration': `${COVER_MS}ms`, '--reveal-duration': `${REVEAL_MS}ms` } as CSSProperties}>
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
