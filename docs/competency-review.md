# Competency classification review

The original 2026-11-04 migration preserved 374 labels and categories. After the NLP and RAG consolidations, the catalog has 372 terms and 24 outstanding field/category placements. Views consistently use the catalog category even when a record stores a reference under a different field.

## Resolved: Natural Language Processing

`NLP` and `Natural Language Processing` now resolve to one research domain, displayed as **Natural Language Processing**. The used `nlp` ID is retained; the retired `natural-language-processing` ID is an alias. Case-insensitive ID lookup keeps the short form `NLP` valid for older references and links. Both old graph-link IDs continue to resolve.

All 27 existing supporting records remain connected, and their domain placements now agree with the catalog. New repository discovery emits the full name. The current CV/resume policy excludes research domains from skill groups, so NLP no longer appears under AI Tools there. Whether domains should appear in those skill groups is a separate presentation decision.

## Resolved: Retrieval-Augmented Generation

`RAG` is now an alias of **Retrieval-Augmented Generation**, retaining the used `retrieval-augmented-generation` ID. Case-insensitive alias lookup also preserves the retired `rag` link ID. All seven existing supporting records remain connected to the same research-domain node. The category and CV/resume visibility are unchanged; new repository discovery already emits the full name.

## Resolved: Named Entity Recognition

`NER` is displayed as **Named Entity Recognition** under Research Domains, retaining the `ner` ID. Case-insensitive ID lookup preserves all existing `NER` references and links. All five supporting records remain connected; their domain placements now agree with the catalog. Like NLP, NER follows the current CV/resume domain-exclusion policy and no longer appears under AI Tools in skill groups.

## Resolved: Vision-Language Models

`VLM` is displayed as **Vision-Language Models** under Research Domains, alongside the existing LLMs domain. The `vlm` ID and case-insensitive `VLM` references continue to resolve to this single entry. The Biomedical Paper Information Extractor retains its connection; its domain placement now agrees with the catalog. VLM follows the existing CV/resume policy that excludes domains from skill groups.

Only the canonical full label is rendered on competency chips and graph nodes. Preserved abbreviations are alternate references, not extra entries or additional displayed labels. Existing prose descriptions retain their wording.

## Stored references

Portfolio competency fields use the full canonical labels for Natural Language Processing, Named Entity Recognition, Vision-Language Models, and Retrieval-Augmented Generation. The 33 abbreviated values were normalized (27 NLP, five NER, one VLM); all seven RAG references already used the full name. Helper reference lists and the project-analysis prompt use those same names. A regression test guards these stored references against abbreviated values returning.

Stable IDs and alias mappings remain for existing links. Prose descriptions, titles, repository URLs, and other record fields retain their original wording. This normalization changes neither graph connections nor evidence counts.

## Decisions to review

- `Agile` and `Public Speaking` occur in domains but are cataloged as soft skills.
- Some technical tools were stored in `personal_skills` on a personal project. A project's context need not change a tool's category.
- `Telegram` remains personal as requested. `Technical Writing` and `Scientific Writing` remain distinct.

After deciding, change the catalog/category or record placement and rerun validation. To merge terms, keep one ID, move the retired label/ID into aliases, and remove the redundant term. Never reuse an existing ID for another concept.

## Placement summary

| Term | Record field | Catalog category | Occurrences |
|---|---|---|---:|
| Agile | `domains` | `soft_skills` | 14 |
| Public Speaking | `domains` | `soft_skills` | 1 |
| Topaz Video AI | `personal_skills` | `ai_tools` | 1 |
| Ruby/Rails | `personal_skills` | `prog_languages` | 1 |
| TriplyDB | `personal_skills` | `dev_tools` | 1 |
| Kubernetes | `personal_skills` | `dev_tools` | 1 |
| GoDaddy | `personal_skills` | `cloud` | 1 |
| LucidChart | `personal_skills` | `design` | 1 |
| Google Cloud Platform | `personal_skills` | `cloud` | 1 |
| Heroku | `personal_skills` | `cloud` | 1 |
| Ontotext Refine | `personal_skills` | `dev_tools` | 1 |

## All affected records

Regenerate the current list with `python3 .github/scripts/validate_yaml_terms.py`.

| Record | Field | Term | Catalog category |
|---|---|---|---|
| `work/stealth-startup` | `domains` | Agile | `soft_skills` |
| `work/handshake-ai` | `domains` | Agile | `soft_skills` |
| `work/upwork-software-test` | `domains` | Agile | `soft_skills` |
| `work/forumapi` | `domains` | Agile | `soft_skills` |
| `work/publix` | `domains` | Public Speaking | `soft_skills` |
| `pub/phd-dissertation` | `domains` | Agile | `soft_skills` |
| `pub/towards-agile-academia` | `domains` | Agile | `soft_skills` |
| `pub/scrum-in-classroom` | `domains` | Agile | `soft_skills` |
| `pub/digital-rubber-duck` | `domains` | Agile | `soft_skills` |
| `pub/microelectronic-ai-dishonesty` | `domains` | Agile | `soft_skills` |
| `pub/interpersonal-chemistry-agile` | `domains` | Agile | `soft_skills` |
| `proj/personal` | `personal_skills` | Topaz Video AI | `ai_tools` |
| `proj/personal` | `personal_skills` | Ruby/Rails | `prog_languages` |
| `proj/personal` | `personal_skills` | TriplyDB | `dev_tools` |
| `proj/personal` | `personal_skills` | Kubernetes | `dev_tools` |
| `proj/personal` | `personal_skills` | GoDaddy | `cloud` |
| `proj/personal` | `personal_skills` | LucidChart | `design` |
| `proj/personal` | `personal_skills` | Google Cloud Platform | `cloud` |
| `proj/personal` | `personal_skills` | Heroku | `cloud` |
| `proj/personal` | `personal_skills` | Ontotext Refine | `dev_tools` |
| `proj/ecocar` | `domains` | Agile | `soft_skills` |
| `proj/arocket` | `domains` | Agile | `soft_skills` |
| `CS225, CS225L` | `domains` | Agile | `soft_skills` |
| `SE510` | `domains` | Agile | `soft_skills` |
