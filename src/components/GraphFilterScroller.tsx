import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  backgroundColor: string
  hintColor: string
}

export default function GraphFilterScroller({ children, backgroundColor, hintColor }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const maximum = Math.max(0, element.scrollWidth - element.clientWidth)
      const offset = Math.max(0, Math.min(element.scrollLeft, maximum))
      const left = element.clientWidth > 0 && offset > 1
      const right = element.clientWidth > 0 && offset < maximum - 1
      setEdges(previous => previous.left === left && previous.right === right ? previous : { left, right })
    }
    update()
    element.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    // Label/font changes can alter overflow without resizing the container.
    for (const child of element.children) observer.observe(child)
    return () => {
      element.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="flex min-w-0 items-center gap-1 sm:block">
      <button type="button" aria-label="Scroll filters left" disabled={!edges.left}
        className="h-11 w-9 shrink-0 rounded border text-xl font-bold disabled:opacity-25 sm:hidden"
        style={{ color: hintColor, borderColor: hintColor, backgroundColor }}
        onClick={() => ref.current?.scrollBy({ left: -ref.current.clientWidth * 0.75, behavior: 'smooth' })}
      >‹</button>
      <div className="relative min-w-0 flex-1">
        <div
          ref={ref}
          role="group"
          aria-label="Graph node type filters"
          tabIndex={0}
          className="relative flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-x-visible py-1 sm:py-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {children}
        </div>
        {(['left', 'right'] as const).map(edge => edges[edge] && (
          <span key={edge} aria-hidden="true" data-scroll-edge={edge}
            className={`pointer-events-none absolute inset-y-0 w-6 sm:hidden ${edge === 'left' ? 'left-0' : 'right-0'}`}
            style={{ background: `linear-gradient(to ${edge === 'left' ? 'right' : 'left'}, ${backgroundColor}, transparent)` }} />
        ))}
      </div>
      <button type="button" aria-label="Scroll filters right" disabled={!edges.right}
        className="h-11 w-9 shrink-0 rounded border text-xl font-bold disabled:opacity-25 sm:hidden"
        style={{ color: hintColor, borderColor: hintColor, backgroundColor }}
        onClick={() => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.75, behavior: 'smooth' })}
      >›</button>
    </div>
  )
}
