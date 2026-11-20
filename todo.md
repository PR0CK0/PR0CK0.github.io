# TODO

## Full manual audit — legacy view + PDF review pass

Comprehensive 1-by-1 audit of every publication and project. Upload each PDF/repo to Claude, extract all technologies, domains, and soft skills that are missing. Cross-reference with the legacy CV HTML view to catch anything the YAML doesn't cover.

- [ ] Walk through legacy view (`/legacy`) entry by entry, compare against YAML for completeness
- [ ] For each publication: upload the PDF, grep for tools/languages/frameworks/ontologies/datasets, update YAML
- [ ] For each project: clone or browse the repo, identify all technologies used, update YAML
- [ ] Verify no entries are missing from the YAML that appear in the legacy view
- [ ] Reconcile any discrepancies between legacy CV content and YAML data

## Publications — add technologies (needs PDF review)

Domains are done for all 40 pubs. Technologies still need a PDF review pass.
All pubs already have `Microsoft Word` and `Microsoft Teams`. Grab the PDFs,
feed to Claude, and populate `technologies` in the YAML.

Use scripts/update_pubs_batchN.py pattern to apply changes.

- [x] pub/explainable-ml-semantic-web
- [x] pub/interpersonal-chemistry-agile
- [x] pub/swebok-kg-transformer
- [x] pub/microelectronic-ai-dishonesty
- [x] pub/auto-bfo-aristotelian-definitions
- [x] pub/towards-agile-academia
- [x] pub/prov-o-bfo-mapping
- [x] pub/graph-rag-survey
- [x] pub/ml-lifecycle-provenance-survey
- [x] pub/linked-data-aerospace
- [x] pub/ontology-sdlc-aerospace
- [x] pub/robust-training-datasets-ontologies
- [x] pub/semantic-science-beyond-pdf
- [x] pub/dawn-of-dialogue
- [x] pub/lm-kg-survey
- [ ] pub/scrum-in-classroom
- [ ] pub/gps-signal-strength
- [x] pub/auto-code-documentation
- [x] pub/gpt4-stochastic-parrot
- [ ] pub/catastrophic-forgetting
- [ ] pub/digital-rubber-duck
- [ ] pub/validating-security-requirements-kg
- [ ] pub/secure-development-ontology
- [ ] pub/vr-software-requirements
- [ ] pub/ml-misbehaviors-taxonomy
- [x] pub/kg-geospatial-sumo (skip — idea only)
- [x] pub/sdlc-ontology-engineering (skip — idea only)
- [ ] pub/cognitive-assistants-aviation-inprogress
- [x] pub/colleague-thesis-vonderhaar (skip)
- [x] pub/colleague-thesis-kiselev (skip)
- [x] pub/competition-proposal-nas (skip)
- [x] pub/grant-proposal-nsf (skip)
- [ ] pub/article-synthetic-ontologies

## Publications — citation count display

- [ ] **Show total citation count on CV/Resume** — OpenAlex per-paper `cited_by_count` is already stored in YAML and updated weekly, but the aggregate is ~4× lower than Google Scholar (OpenAlex: ~61, Google Scholar: 238). Options: (a) add a `total_citations` field to the person object in YAML that you manually bump periodically; (b) find an API with Scholar-level coverage (Semantic Scholar may be better). For now, citation count is hidden from the display.

## CV / Resume — typography normalization

- [x] **Normalize CV and Resume header fonts and sizes** — Extracted into `src/lib/pdf-constants.ts` (`FS`, `COLOR`, `px`). Both CVExport and ResumeExport now reference shared tokens; no bare hex or numeric size literals remain in either file.

## Legacy index.html — full port audit

- [x] **Compare historical CV copies with current YAML and renderers** — See [legacy CV audit](docs/legacy-cv-audit.md). Both historical copies have identical visible content. The current generated CV has reproducible rendering gaps; some historical details also need reconciliation.
- [ ] **Repair legacy rendering** — Restore 41 project descriptions, 12 omitted extracurricular entries, headings/dates for included extracurriculars, and stored publication credits/details. Use current YAML fields and add regression coverage.
- [ ] **Reconcile historical detail** — Review the audit's project/work details before declaring the migration complete; keep current factual updates and intentional CV exclusions.
- [ ] **Retire `public/legacy/index.html` and `index-new.html` after reconciliation** — Five links from retained/generated legacy pages still target the old index. Update and verify these links first. `/legacy` loads the generated `public/legacy/cv.html`; decide how old direct URLs should behave before removing the copies.

## Skill category labels — Landing and Schema normalization

- [x] **Normalize skill category headings between Landing page and schema** — The `SkillSchema` `category` enum uses snake_case keys (e.g. `prog_languages`, `ai_tools`, `soft_skills`) while the Landing page renders human-readable labels (e.g. "Programming Languages", "AI Tools"). These mappings live in separate places and can drift. Consolidate into a single `SKILL_CATEGORY_LABELS` constant shared between the schema/graph and the Landing render so adding a new category only requires one change.

## Light Mode

- [x] **Light mode on Graph, CV, Resume pages** — Graph.tsx uses hundreds of hardcoded hex colors in inline styles and Cytoscape stylesheet; CV/Resume use hardcoded print colors. All need migrating to Tailwind CSS variable classes (`bg-terminal-bg` etc.) to respect `html.light`. About and Landing already work correctly.

## Graph

- [x] **Keyboard access and navigation contrast** — Skill chips are links; graph filters visibly show keyboard focus; search offers keyboard-selectable results, including hidden nodes. Navigation text meets 4.5:1 in both themes. Browser regressions cover desktop/mobile graph layouts, Escape, and empty results.

- [x] **Remove ignored graph shadow styles** — Remove ten unsupported Cytoscape declarations. Person labels and selected-node borders remain unchanged; selection tests require initialization and interactions to produce no warnings.

- [x] **Fix diamond center clicks and taps** — Patch Cytoscape's double-counted polygon vertex, preserving Person and Associate diamonds. Fresh installs apply the tracked patch automatically. Unit and browser checks cover the exact center axis at multiple zoom levels; the mobile test no longer offsets clicks.

- [x] **Simplify mobile graph details** — Prevent sideways drawer overflow, show five connections with an expansion count, add vertical scroll cues/buttons, and make horizontal filter arrows clickable. Browser checks cover expansion, direction boundaries, selection reset, small screens, and themes.

- [x] **Keep mobile graph controls visible** — Fit the graph below the navigation bar; open selected-node details first in the mobile drawer. Browser regression checks cover viewport bounds, desktop resizing, canvas clicks/taps, and connected-node navigation.

- [x] **Restore omitted competency relationships** — One linking helper handles all supported fields across education, work, publications, projects, courses, certificates, talks, and extracurriculars. It creates nodes only from included records. Regression tests cover each record type, isolated skills, duplicate tags, and excluded records. Current data gains 38 missing edges.

- [x] **Stop graph event listeners accumulating on React updates** — Register each graph handler once per Cytoscape instance and remove it on replacement/unmount. Regression coverage: `src/lib/__tests__/graph-listeners.test.ts`.

- [x] **Unify graph link and click selection** — Fresh and cached graph links already dim the neighborhood correctly; retire the stale timing report. Links and connected-node navigation now reuse the click handler, preserving record descriptions as well as neighbor expansion and dimming. Regression tests compare link/click details and classes, and verify background deselection.
- [x] **Graph filter scroll shadows** — Mobile edge fades and arrows reflect remaining overflow in each direction. Independent drawer observers handle opening, resizing, and label/font changes without dependencies; unit and browser checks cover boundaries, keyboard scrolling, themes, and filter interactions.

## Ensure full coverage of domains, technologies, soft_skills on all entries

Every work_experience, publication, project, extracurricular, talk, and course entry
should have at minimum: technologies, domains. Soft skills where applicable.

- [ ] work_experiences — audit all entries for missing domains (afrl-2019 through afrl-2023, upwork entries, etc.)
- [ ] publications — technologies still need PDF review pass (see section above)
- [ ] projects — 16 deferred projects still need domains/techs (see section below)
- [ ] extracurriculars — verify all 26 entries have appropriate coverage
- [ ] courses — add technologies/domains to course entries
- [ ] talks — verify domains/technologies populated

## SEO & Discoverability

- [x] **Consistent route metadata** — One canonical URL and description per page, with matching page-specific Open Graph/Twitter titles and descriptions. Homepage title and description come from YAML. Unit tests cover ownership; `scripts/test-seo.mjs` checks delivered HTML for every route and client navigation.
- [x] **Accurate sitemap dates** — Prerendering recovers each page's UTC source update from Git history, following local imports, shared metadata, relevant YAML sections, and assets. Rebuilds and unrelated documentation edits preserve dates. Full tree history with filtered blobs avoids downloading old image binaries; tests cover scope, merges, and missing history.
- [x] **Source-driven project pages** — Local review: searchable index and detail pages for all visible YAML records, optional source-authored sections/images/resources, source-based URLs, generated sitemap entries, and per-record update dates. Homepage buttons sit beneath recent projects; no new top-navigation link. Four records include expanded notes; all other visible records have pages from existing content. Await design approval before deployment.
- [ ] **Source-driven paper pages** — Add a publication index and detail template using existing source records after reviewing project pages.
- [x] **Repository rename tracking** — Backfilled stable GitHub repository IDs; metadata sync, discovery, topic validation, and homepage previews now recognize repository identity across renames. Curated titles, portfolio IDs, and page slugs stay stable. Regression tests cover transfers, reused names, contribution exclusions, and failed lookups. Implemented locally; deployment pending project-page approval.
- [x] **Refresh structured profile metadata** — Prerendering fills the employer from the YAML's explicit `primary_work_experience` reference (Apacen), along with profile name, headline, summary, email, website, social links, ORCID, and the homepage's source update date. These duplicated values have been removed from the HTML template. Tests cover employer changes and broken references.
- [x] **Create OG image** — Approved 1731×909 PNG at `public/og-image.png`; shared by Open Graph and Twitter metadata, with matching dimensions and alternative text. Regression test checks the referenced file and dimensions.
- [ ] **Google Search Console** — verify procko.pro, submit sitemap.xml, request indexing.
- [ ] **Bing Webmaster Tools** — import from Google Search Console (covers Bing + DuckDuckGo + Yahoo).
- [x] **Prerendering** — Static routes and every visible source-driven project page generate HTML snapshots. Tests cover static routes and source-derived project URLs.
- [x] **sitemap.xml** — Static routes plus generated project entries; per-page lastmod comes from Git history. Tests cover route coverage and per-project date isolation.
- [x] **robots.txt** — exists, allows all, points to sitemap.
- [x] **humans.txt** — exists, auto-updated with deploy date on every push.
- [ ] **ScholarlyArticle JSON-LD** — add structured data for top publications to improve Google Scholar and search visibility.
- [ ] **Backlinks audit** — ensure procko.pro is linked from: LinkedIn website field, Google Scholar profile, ORCID, Substack about page, SSRN author page, ERAU directory if possible.
  - [x] Substack — linked ✓
  - [ ] Google Scholar — NOT linked; add procko.pro as homepage in Scholar profile settings
  - [ ] ORCID — unverified (JS-rendered); manually check and add procko.pro as website
  - [ ] LinkedIn — blocked by scraper; manually verify website field
  - [ ] SSRN — blocked by scraper; manually verify author profile
  - [ ] ERAU directory — not checked
- [ ] **Blog/content section** — Google ranks pages with text content. Pull Substack RSS or add articles section for more indexable pages.
- [ ] **Update GitHub bio** — "AI engineer bridging ontologies and LLMs — knowledge graphs, agentic RAG, provenance. PhD. DoD-cleared."
- [ ] **Pin best GitHub repos** — PR0CK0.github.io, ProvTracer, awesome-bfo, StableDiffusionEndToEndGuide, dissenter, ai-landscape-digest.
- [ ] **Star ecosystem repos** — star BFO, Protégé, cytoscape, etc. to signal your ecosystem to profile visitors.

## YAML purity — no HTML or styling in source data

- [x] **Strip all HTML/styling artifacts from `tyler-procko.yaml`** — Phase 1 done: removed tags (74), description duplicates in work/projects (57), close_span_before_end_link (1), primary_author_position (14), after_span_text (2), after_link_text (1), org_extra_after_italic (1). Remaining: date_display, title_line, org — need Jinja2 template updates first. — The YAML is a pure data file; presentation logic belongs in the React components. Known offenders include fields like `close_span_before_end_link`, `primary_author_position: in_span`, `after_span_text`, `after_link_text`, `org_extra_after_italic`, and any raw `<i>`, `<a>`, or similar HTML tags embedded in string values. Each of these is a legacy holdover from the old Jinja2/HTML build. Audit every field, remove the HTML-aware fields, and implement equivalent presentation logic in the components that render those entries.

## Web dev best practices audit

- [x] **Defer graph and PDF downloads** — Lazy-load the graph, CV, and résumé routes; keep navigation visible while loading. Initial JavaScript decreased from about 2.46 MB to 497 KB (779 KB to 151 KB gzip). Regression checks cover route loading, homepage requests, direct links, and both PDF exports.
- [ ] **Research and apply web dev best practices** — As the site grows, audit against standard production patterns: code splitting and lazy loading (are all pages lazy-loaded via React.lazy?), bundle size analysis (`vite build --report`), image optimization, caching headers on GitHub Pages, accessibility (a11y — semantic HTML, ARIA labels, keyboard nav, color contrast), Core Web Vitals (LCP, CLS, FID), and scalability of the single YAML fetch (consider splitting into section-level files if the YAML grows large). Also review whether the runtime YAML fetch should be replaced with build-time static generation as content volume increases.

## Markdown skill count — extracurriculars not aggregated

- [x] **Markdown skill count** — audited; extracurriculars are included in aggregation. Count was low because entries hadn't been tagged yet — now resolved after extracurricular audit pass.

## Personal page — art, creative work

- [x] **Restore personal/creative page** — `/personal` displays the drawing gallery with a lightbox.
- [x] **Keyboard access to the art gallery** — All 54 thumbnails are labeled buttons with visible focus; the native modal contains focus and restores it on close. Browser tests cover Enter/Space/Escape, Tab/Shift+Tab, mouse, and mobile touch.
- [x] **Deduplicate artwork** — Both galleries share the 54 canonical `/art/` images, preserving their individual display orders and removing 194 MB of duplicate PNGs.

## Potential / Future

- [ ] **LinkML schema migration** — Replace `schema.ts` (Zod) with a LinkML schema (`schema.yaml`). Data YAML stays identical. Gains: build-time `linkml-validate`, `gen-owl` produces an OWL ontology of the CV (cool talking point), `gen-python` for typed Python models, `gen-json-schema` for JSON Schema validation. Cost: Python codegen step added to build pipeline, no official Zod generator (would need to keep or regenerate Zod separately). Worth doing if OWL export or multi-language pipeline ever becomes a goal.

## Projects — package version on landing cards

- [ ] **Show package version on GitHub project cards** — for projects published to a package registry (crates.io, npm, PyPI, etc.), fetch and display the latest version number on the landing page card. The `url` field already points to the registry page for some projects (e.g. quizzical → crates.io); could use registry APIs (crates.io `/api/v1/crates/{name}`, npm registry, PyPI JSON API) at build time or runtime to pull the latest version string and render it as a small chip on the card.

## Projects — link audit & display order

- [x] **Audit current project, publication, and credential links** — Checked 147 distinct source URLs; see [results and limitations](docs/current-link-audit.md). Fixed double-prefixed DOI URLs on all 33 graph DOI buttons. Quizzical verified in a browser; publisher/social access restrictions remain unverified, not declared dead.
- [ ] **Review project display order in CV/resume** — current sort is featured-first then year desc; decide if a manual ordering or different priority makes more sense for the top 8

## Shared competency catalog

- [x] Replace separate vocabulary lists with `src/data/competencies.json`; share canonical identities/categories across homepage, graph, and React CV/resume.
- [x] Count supporting records consistently, including education/certificates; deduplicate repeated tags; use stable graph links.
- [x] Validate unknown/ambiguous references and test graph/count agreement before deployment.
- [x] Consolidate NLP/Natural Language Processing as one research domain, retaining existing IDs and evidence.
- [x] Consolidate RAG as an alias of Retrieval-Augmented Generation, retaining the existing domain node and seven supporting records.
- [x] Classify NER as Named Entity Recognition under Research Domains, preserving its ID and five supporting records.
- [x] Classify VLM as Vision-Language Models under Research Domains, preserving its ID and project connection.
- [x] Normalize NLP, NER, VLM, and RAG competency reference values and helper lists to their full canonical labels; preserve prose and link IDs.
- [x] Classify Agile under Research Domains, preserving its name, ID, and 14 supporting records.
- [x] Move Public Speaking on the Publix record into Soft Skills, preserving its existing identity and connections.
- [ ] Review whether research domains should appear in CV/resume skill groups; NLP, NER, VLM, and Agile follow the current exclusion policy.
- [x] Resolve the [remaining field/category disagreements](docs/competency-review.md): keep the nine tools used only in Personal & Creative Work under Personal, retaining their references and exclusions.

## Type hierarchy organization

- [ ] **Organize and document skill/domain/extracurricular type hierarchies** — The `SkillSchema` `category` enum, extracurricular `type` values (scholarly/organization/volunteer), and similar categorical fields are scattered and undocumented. Audit all enum-like fields in `schema.ts`, define a canonical type hierarchy (e.g., skill categories, extracurricular types, publication statuses), and ensure every YAML entry uses valid values. Consider a shared `types.ts` or constants file so the hierarchy is explicit and easy to extend.

## Certifications — add links

- [x] **Audit and add `url` fields to all certification entries** — Many certs in the YAML are missing `url` fields pointing to the credential verification page (e.g., Credly badge, issuer portal, LinkedIn credential). Add URLs so they render as clickable links in the CV/resume.

## Skills section orphans — attach or drop

These were in the now-deleted `skills:` YAML section but are not attached to any entry. Decide: attach to the right entry, or drop entirely.

- [ ] `FastAPI` — used somewhere? check projects/work
- [x] `Git` — already attached to two records; confirmed in the current YAML.
- [ ] `Linux Ubuntu` — OS; `Linux` is in COMPETENCY_CATEGORIES but not `Linux Ubuntu`; may need rename
- [ ] `Microsoft Copilot` — used personally? attach or drop
- [ ] `NLTK` — no repo evidence found in BFO-Wikidata, bert_benchmarking, bfobert, swebok-rebel-rdf
- [ ] `TensorFlow` — no repo evidence found in same repos
- [ ] `Windows (XP, Vista, 7, 8, 10, 11)` — name mismatch; COMPETENCY_CATEGORIES has `Windows` only

## Scientific Writing — move from soft_skills to domains in YAML

- [x] **Move `Scientific Writing` references into `domains:`** — All 62 current references are already in `domains`; none remain in `soft_skills`.

## Other pending

- [x] **Audit `tags` field in YAML schema** — Removed all 74 tags fields; content fully covered by `domains` and `technologies`.

- [x] **Audit YAML for redundant data** — Removed description from 57 work/project entries where bullets was present (templates use bullets only). Remaining: date_display, title_line, org still needed by Jinja2 templates — defer until legacy view is ported.

- [x] proj/personal — show its 19 tools under Personal & Creative Use on the site/graph, keep them off CV/resume, and preserve the other five hidden projects with independent visibility flags. Telegram is Communication Tools and belongs only to the Christian Denominations Wikidata project.



- [x] **Tests: detect unmapped terms** — Test suite should flag technologies/domains/soft_skills/personal_skills that appear in YAML but aren't recognized/validated. Example: `Git` is in YAML but doesn't show in UI (unmapped in tech-categories). Need validation that catches these orphan terms.
- [ ] Extracurriculars — add technologies/domains to entries missing coverage:
  - [ ] `extra/comptia-study-guide` — suggest: `Markdown`
  - [x] `extra/swebok-v4-review` — no obvious technologies; maybe just domains
  - [x] `extra/dair-prompt-engineering` — suggest: `Markdown`, `Git`
  - [ ] `extra/ontogpt-contributor` — suggest: `Python`, `Git`, `OWL`
  - [x] `extra/huge-ai-models-contributor` — suggest: `Markdown`, `Git`
  - [ ] `extra/practical-nlp-errata` — no obvious technologies
  - [x] `extra/semantalytics-contributor` — suggest: `RDF`, `OWL`
  - [x] `extra/generativeai-and-linkeddata` — suggest: `Python`, `RDF`, `JSON-LD`; needs domains too
  - [x] `extra/machine-learning-ontologies` — suggest: `OWL`, `Protégé`, `BFO`
  - [ ] `extra/openai-cybersecurity-grant-proposal` — suggest: `Markdown`; needs domains too
  - [ ] `extra/protegetutorials` — has `GraphViz`, no domains; suggest: `Protégé`, `OWL`
  - [ ] `extra/ieee-member` — org membership; probably skip
  - [ ] `extra/asee-member` — org membership; probably skip
  - [ ] `extra/erau-ai-club` — suggest: `Python`
- [ ] work/publix — add technologies (minimal)
- [x] Publications UI — pub domains already aggregated into the landing page skill chips (paradigms category); no per-row chips needed
- [ ] LLM model coverage — audit all work/project/pub/extracurricular entries and add specific model names where used:
  - OpenAI: `GPT-3.5`, `GPT-4`, `GPT-4o`, `o1`, `o3`, `ChatGPT`, `Codex`, `OpenAI API`
  - Anthropic: `Claude 3`, `Claude 3.5 Sonnet`, `Claude Code`, `Anthropic API`
  - Google: `Gemini 1.5`, `Gemini 2.0`, `Gemini API`
  - Meta: `Llama`, `Llama 3`
  - Other: `Grok`, `Mistral`, `Mixtral`, `Copilot`
  - Currently entries use generic "GPT", "Claude", "Gemini" — replace/supplement with specific model versions where known

## Projects — domains/technologies (need local clones)

Local clones not available; grab and analyze with Claude when possible.

- [ ] proj/bfo-wikidata-classifier — https://github.com/PR0CK0/BFO-Wikidata-Classifier
- [ ] proj/bert-benchmarking — https://github.com/PR0CK0/bert_benchmarking
- [ ] proj/bfobert — https://github.com/PR0CK0/bfobert
- [ ] proj/stable-diffusion-testing — https://github.com/PR0CK0/StableDiffusionEndToEndGuide
- [ ] proj/nlp-optimization — https://github.com/PR0CK0/Mandelbrot-Set-Calculation-Optimization-in-Scientific-Python
- [ ] proj/bfo-buddy — https://github.com/PR0CK0/bfobuddy
- [ ] proj/usa-obesity-visualization — https://github.com/PR0CK0/RandomDataAnalysisProjects
- [ ] proj/upper-martial-arts-ontology — https://github.com/PR0CK0/UpperMartialArtsOntology
- [ ] proj/volusia-elevation-qgis — https://github.com/PR0CK0/CS540_Project
- [ ] proj/meme-ontology — https://github.com/PR0CK0/knowyourmeme.com-Crawler
- [ ] proj/vxworks-water-heater — https://github.com/PR0CK0/VxWorksWaterHeater
- [ ] proj/lan-board-game — https://github.com/PR0CK0/SOS-Game-LAN-Capable
- [ ] proj/monster-hunter-world — https://github.com/PR0CK0/mhw
- [ ] proj/eagle-listings — https://github.com/PR0CK0/EagleListings
- [ ] proj/tiles-game — https://github.com/PR0CK0/TilesGame
- [ ] proj/text-racing-game — https://github.com/PR0CK0/C_TextBasedRacingGame

## Automatic updates

- [x] **Deploy repository-description updates** — Use the existing automation token and auto-merge PR pattern so validation and deployment run; unchanged data creates no PR, and missing credentials fail explicitly.
