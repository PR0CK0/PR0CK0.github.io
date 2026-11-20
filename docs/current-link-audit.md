# Current portfolio link audit

Checked 2026-11-20 against the current YAML and graph renderer. Legacy HTML was excluded.

## Confirmed fix

All 33 stored publication DOI values are full resolver URLs. The graph prepended `https://doi.org/` again, producing invalid destinations such as `https://doi.org/https://doi.org/…`. The renderer now constructs one HTTPS resolver URL from either a bare DOI or a full `doi.org`/`dx.doi.org` URL. Regression tests exercise graph selection with each form.

The source URLs in YAML did not need replacement.

## URL checks

Checked 147 unique URLs from project, publication, certificate, education, work, extracurricular, social-link, associate, and talk records. Fields checked were `url`, `repo_url`, `doi`, `thesis_url`, `thesis_github`, `advisor_url`, and `org_url`; bare DOIs were resolved through `doi.org`. This is not an exhaustive crawl of every nested link or runtime-discovered GitHub card.

Requests followed redirects with TLS verification enabled, six concurrent workers, an 18-second request timeout, and a GET retry for failed HEAD requests.

| Initial result | Unique URLs | Interpretation |
|---|---:|---|
| HTTP 200 | 96 | Reachable; status alone does not prove destination content is correct. |
| HTTP 202, all IEEE destinations | 18 | Unverified publisher content. A representative browser check reported IEEE's explicit unusual-traffic restriction (418). |
| HTTP 403 | 31 | Restricted checks, primarily SSRN, MDPI, AIAA, ASEE, Medium, Upwork, and LinkedIn. Not evidence that the URLs are dead. |
| HTTP 999 | 1 | LinkedIn access restriction. |
| HTTP 404 | 1 | Quizzical registry page; subsequent browser check returned 200 and the correct package page. Registry API and repository manifest also agree. False alarm; URL retained. |

The source fields contain 46 distinct project URLs (45 returned 200; Quizzical verified separately), 66 publication URLs (20 returned 200, 18 returned 202, 28 returned 403), and ten certificate URLs (nine returned 200; the Upwork profile returned 403). URLs shared across sections are counted once in the overall total.

No dead source URL with a confirmed replacement was found. Restricted destinations remain unverified rather than being removed or declared healthy.

## Existing automation limitation

The weekly checker skips entire domains including `doi.org` and `crates.io`, and checks stored YAML rather than graph-generated links. Its successful 2026-11-15 run therefore did not establish that the graph's DOI buttons worked. This change adds renderer regression coverage; it does not alter the checker, its exclusions, or CI tooling.
