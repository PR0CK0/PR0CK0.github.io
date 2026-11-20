import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  path: string
}

const SITE = 'https://procko.pro'

export default function SEO({ title, description, path }: SEOProps) {
  const pageTitle = path === '/' ? title : `${title} | procko.pro`
  const url = `${SITE}${path}`

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
