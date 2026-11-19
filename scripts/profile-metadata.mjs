export function buildProfileMetadata(template, person, modified) {
  const work = person.work_experiences?.find(item => item.id === person.primary_work_experience)
  if (!work?.is_current || work.end_date) {
    throw new Error('primary_work_experience must identify a current work record without an end date')
  }

  const output = structuredClone(template)
  const profile = output['@graph'].find(node => node['@type'] === 'Person')
  const website = output['@graph'].find(node => node['@type'] === 'WebSite')
  const page = output['@graph'].find(node => node['@type'] === 'ProfilePage')
  Object.assign(profile, {
    name: person.name,
    jobTitle: person.title?.split(' — ')[0],
    description: person.summary,
    url: person.website,
    email: person.email_personal,
    worksFor: { '@type': 'Organization', name: work.organization, url: work.org_url },
    sameAs: person.social_links?.map(link => link.url),
    identifier: person.orcid ? {
      '@type': 'PropertyValue', propertyID: 'ORCID',
      value: person.orcid, url: `https://orcid.org/${person.orcid}`,
    } : undefined,
  })
  profile.hasOccupation.name = profile.jobTitle
  website.name = person.name
  website.description = person.seo_description
  website.url = person.website
  page.dateModified = modified
  return output
}
