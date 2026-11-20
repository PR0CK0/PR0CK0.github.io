import { useState, useEffect, useCallback, useRef } from 'react'
import SEO from '@/components/SEO'
import SiteFooter from '@/components/SiteFooter'

// ── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    year: '2020',
    label: '2020',
    caption: 'A lot of 1–3 minute reference sketching — the goal is to capture form as fast as possible.',
    count: 20,
  },
  {
    year: '2016',
    label: '2016',
    caption: '18–19 years old.',
    count: 8,
  },
  {
    year: '2015',
    label: '2015',
    caption: '17–18 years old.',
    count: 14,
  },
  {
    year: '2014',
    label: '2014',
    caption: '16–17 years old.',
    count: 6,
  },
  {
    year: 'early',
    label: 'Early',
    caption: 'Birth to 16 years old.',
    count: 6,
  },
]

// ── Lightbox ──────────────────────────────────────────────────────────────────

type SelectedDrawing = { src: string; alt: string; trigger: HTMLButtonElement }
const FOCUS_OUTLINE = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4c9b0]'

function Lightbox({ src, alt, trigger, onClose }: SelectedDrawing & { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current!
    dialog.showModal()
    return () => {
      dialog.close()
      if (trigger.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [trigger])

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${alt} enlarged`}
      className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-screen max-h-none max-w-none items-center justify-center border-0 p-0 backdrop:bg-transparent"
      style={{ background: 'rgba(10, 8, 5, 0.92)' }}
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      onKeyDown={event => {
        // The close button is the dialog's only keyboard control.
        if (event.key === 'Tab') {
          event.preventDefault()
          closeRef.current?.focus()
        }
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className={`absolute top-5 right-6 text-3xl leading-none transition-opacity hover:opacity-60 ${FOCUS_OUTLINE}`}
        style={{ color: '#d4c9b0', fontFamily: 'Georgia, serif' }}
        aria-label="Close"
      >
        ×
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
        style={{ border: '1px solid rgba(212, 201, 176, 0.2)' }}
      />
    </dialog>
  )
}

// ── Gallery section ───────────────────────────────────────────────────────────

function GallerySection({
  year, label, caption, count, onOpen,
}: {
  year: string
  label: string
  caption: string
  count: number
  onOpen: (drawing: SelectedDrawing) => void
}) {
  const images = Array.from({ length: count }, (_, i) =>
    `/art/${year}-${String(i + 1).padStart(2, '0')}.png`
  )

  return (
    <section className="mb-12 sm:mb-16">
      <div className="mb-4 sm:mb-6">
        <h2
          className="text-2xl sm:text-3xl mb-1"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#e8dcc8', letterSpacing: '-0.01em' }}
        >
          {label}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: '#7a6a58', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {caption}
        </p>
      </div>

      <div
        className="columns-2 sm:columns-3 lg:columns-4 gap-3"
        style={{ columnGap: '12px' }}
      >
        {images.map((src, i) => {
          const alt = `${label} drawing ${i + 1}`
          return (
            <button
              key={i}
              type="button"
              aria-label={`Open ${alt}`}
              aria-haspopup="dialog"
              className={`mb-3 block w-full break-inside-avoid cursor-pointer overflow-hidden p-0 ${FOCUS_OUTLINE}`}
              style={{ border: '1px solid #3a2a1a' }}
              onClick={event => onOpen({ src, alt, trigger: event.currentTarget })}
            >
              <img
                src={src}
                alt={alt}
                loading="lazy"
                className="w-full block transition-all duration-300 hover:scale-[1.03] hover:brightness-105"
                style={{ display: 'block' }}
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Personal() {
  const [drawing, setDrawing] = useState<SelectedDrawing | null>(null)
  const openLightbox = useCallback((selected: SelectedDrawing) => setDrawing(selected), [])
  const closeLightbox = useCallback(() => setDrawing(null), [])

  return (
    <>
      <SEO
        title="Art"
        description="Drawings by Tyler Procko, spanning 2014–2020."
        path="/personal"
      />

      <main
        className="min-h-screen"
        style={{
          background: `
            radial-gradient(ellipse 110% 35% at 50% 0%, rgba(180, 105, 28, 0.13) 0%, transparent 65%),
            radial-gradient(ellipse 55% 45% at 10% 55%, rgba(120, 65, 15, 0.09) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 90% 80%, rgba(90, 45, 10, 0.08) 0%, transparent 55%),
            linear-gradient(180deg, #201610 0%, #181008 55%, #110b06 100%)
          `.replace(/\s+/g, ' ').trim(),
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">

          {/* Header */}
          <header className="mb-8 sm:mb-10 border-b pb-8" style={{ borderColor: '#3a2a1a' }}>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: '#7a6a58', fontFamily: 'Georgia, serif' }}
            >
              Tyler Procko
            </p>
            <h1
              className="text-4xl sm:text-5xl mb-4"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#e8dcc8', letterSpacing: '-0.02em' }}
            >
              Art
            </h1>
            <p className="text-base leading-relaxed max-w-xl" style={{ color: '#b4a48e', fontFamily: 'Georgia, serif' }}>
              Pencil sketches drawn casually over the years.
            </p>
          </header>

          {/* Sections */}
          {SECTIONS.map((s) => (
            <GallerySection
              key={s.year}
              {...s}
              onOpen={openLightbox}
            />
          ))}
        </div>
      </main>

      <SiteFooter name="Tyler T. Procko" />

      {drawing && <Lightbox {...drawing} onClose={closeLightbox} />}
    </>
  )
}
