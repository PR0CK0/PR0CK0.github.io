import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  path?: string
}

const SITE = 'https://procko.pro'
const DEFAULT_TITLE = 'Tyler T. Procko, Ph.D. — AI Engineer — Ontologies · Knowledge Graphs · LLMs'
const DEFAULT_DESC = 'Tyler T. Procko, Ph.D. — AI Engineer specializing in ontology-grounded LLM systems, knowledge graphs, and agentic AI. 37+ publications.'

export default function SEO({ title, description, path = '/' }: SEOProps) {
  const t = title ? `${title} | procko.pro` : DEFAULT_TITLE
  const d = description ?? DEFAULT_DESC
  const url = `${SITE}${path}`

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={url} />
    </Helmet>
  )
}
