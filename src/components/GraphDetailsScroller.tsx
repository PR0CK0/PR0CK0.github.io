import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  open: boolean
  selectionId?: string
  backgroundColor: string
  color: string
}

export default function GraphDetailsScroller({ children, open, selectionId, backgroundColor, color }: Props) {
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ top: false, bottom: false })

  useEffect(() => {
    const element = viewport.current
    if (!element || !content.current) return
    const update = () => {
      const maximum = Math.max(0, element.scrollHeight - element.clientHeight)
      const offset = Math.max(0, Math.min(element.scrollTop, maximum))
      const top = element.clientHeight > 0 && offset > 1
      const bottom = element.clientHeight > 0 && offset < maximum - 1
      setEdges(previous => previous.top === top && previous.bottom === bottom ? previous : { top, bottom })
    }
    update()
    element.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    observer.observe(content.current)
    return () => {
      element.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0
  }, [selectionId])

  return (
    <div className={`relative min-w-0 sm:hidden ${open ? 'block' : 'hidden'}`}>
      <div id="graph-mobile-details" ref={viewport}
        className="max-h-[55dvh] overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        <div ref={content} className="flex min-w-0 flex-col pb-8">
          {children}
        </div>
      </div>
      {(['top', 'bottom'] as const).map(edge => edges[edge] && (
        <button key={edge} type="button" aria-label={`Scroll details ${edge === 'top' ? 'up' : 'down'}`}
          className={`absolute inset-x-0 z-10 h-8 text-xs font-bold ${edge === 'top' ? 'top-0' : 'bottom-0'}`}
          style={{ color, background: `linear-gradient(to ${edge === 'top' ? 'bottom' : 'top'}, ${backgroundColor} 65%, transparent)` }}
          onClick={() => viewport.current?.scrollBy({ top: (edge === 'top' ? -1 : 1) * viewport.current.clientHeight * 0.75, behavior: 'smooth' })}
        >
          {edge === 'top' ? '↑ More above' : '↓ More below'}
        </button>
      ))}
    </div>
  )
}
