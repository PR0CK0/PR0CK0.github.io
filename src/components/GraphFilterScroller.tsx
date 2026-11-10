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
    <div className="relative min-w-0">
      <div
        ref={ref}
        role="group"
        aria-label="Graph node type filters"
        tabIndex={0}
        className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-x-visible pb-1 sm:pb-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
      {edges.left && (
        <span aria-hidden="true" data-scroll-edge="left" className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-5 items-center sm:hidden"
          style={{ background: `linear-gradient(to right, ${backgroundColor}, transparent)`, color: hintColor }}>
          ‹
        </span>
      )}
      {edges.right && (
        <span aria-hidden="true" data-scroll-edge="right" className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-5 items-center justify-end sm:hidden"
          style={{ background: `linear-gradient(to left, ${backgroundColor}, transparent)`, color: hintColor }}>
          ›
        </span>
      )}
    </div>
  )
}
