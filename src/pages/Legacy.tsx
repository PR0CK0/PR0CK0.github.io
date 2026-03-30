import SEO from '@/components/SEO'

export default function Legacy() {
  return (
    <div className="w-full" style={{ height: 'calc(100vh - 48px)' }}>
      <SEO
        title="Legacy CV"
        description="Legacy HTML curriculum vitae of Tyler T. Procko, Ph.D."
        path="/legacy"
      />
      <iframe
        src="/legacy/cv.html"
        className="w-full h-full border-0"
        title="Legacy CV — Tyler T. Procko"
      />
    </div>
  )
}
