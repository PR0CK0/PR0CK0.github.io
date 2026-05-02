import { useState, useEffect, useCallback } from 'react'
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

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10, 8, 5, 0.92)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-6 text-3xl leading-none transition-opacity hover:opacity-60"
        style={{ color: '#d4c9b0', fontFamily: 'Georgia, serif' }}
        aria-label="Close"
      >
        ×
      </button>
      <img
        src={src}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(212, 201, 176, 0.2)' }}
      />
    </div>
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
  onOpen: (src: string) => void
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
        {images.map((src, i) => (
          <div
            key={i}
            className="mb-3 break-inside-avoid cursor-pointer overflow-hidden rounded"
            style={{ border: '1px solid #3a2a1a' }}
            onClick={() => onOpen(src)}
          >
            <img
              src={src}
              alt={`${label} drawing ${i + 1}`}
              loading="lazy"
              className="w-full block transition-all duration-300 hover:scale-[1.03] hover:brightness-105"
              style={{ display: 'block' }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Personal() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), [])
  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  return (
    <>
      <SEO
        title="Art"
        description="Drawings by Tyler Procko, spanning 2014–2020."
        path="/personal"
      />

      <main
        className="min-h-screen"
        style={{ background: '#1c1510' }}
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

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={closeLightbox} />}
    </>
  )
}
