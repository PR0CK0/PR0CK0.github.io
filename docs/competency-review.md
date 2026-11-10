# Competency classification review

The original 2026-11-04 migration preserved 374 labels and categories. After the NLP and RAG consolidations, the catalog has 372 terms and 30 outstanding field/category placements. Views consistently use the catalog category even when a record stores a reference under a different field.

## Resolved: Natural Language Processing

`NLP` and `Natural Language Processing` now resolve to one research domain, displayed as **Natural Language Processing**. The used `nlp` ID is retained; the retired `natural-language-processing` ID is an alias. Case-insensitive ID lookup keeps `NLP` valid without requiring portfolio records to be rewritten. Both old graph-link IDs continue to resolve.

All 27 existing supporting records remain connected, and their domain placements now agree with the catalog. New repository discovery emits the full name. The current CV/resume policy excludes research domains from skill groups, so NLP no longer appears under AI Tools there. Whether domains should appear in those skill groups is a separate presentation decision.

## Resolved: Retrieval-Augmented Generation

`RAG` is now an alias of **Retrieval-Augmented Generation**, retaining the used `retrieval-augmented-generation` ID. Case-insensitive alias lookup also preserves the retired `rag` link ID. All seven existing supporting records remain connected to the same research-domain node. The category and CV/resume visibility are unchanged; new repository discovery already emits the full name.

## Decisions to review

- `NER` and `VLM` are categorized as AI tools but occur in domains. Decide whether these are techniques, domains, or tools in this portfolio's taxonomy.
- `Agile` and `Public Speaking` occur in domains but are cataloged as soft skills.
- Some technical tools were stored in `personal_skills` on a personal project. A project's context need not change a tool's category.
- `Telegram` remains personal as requested. `Technical Writing` and `Scientific Writing` remain distinct.

After deciding, change the catalog/category or record placement and rerun validation. To merge terms, keep one ID, move the retired label/ID into aliases, and remove the redundant term. Never reuse an existing ID for another concept.

## Placement summary

| Term | Record field | Catalog category | Occurrences |
|---|---|---|---:|
| Agile | `domains` | `soft_skills` | 14 |
| NER | `domains` | `ai_tools` | 5 |
| Public Speaking | `domains` | `soft_skills` | 1 |
| VLM | `domains` | `ai_tools` | 1 |
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
| `work/stealth-startup` | `domains` | NER | `ai_tools` |
| `work/handshake-ai` | `domains` | Agile | `soft_skills` |
| `work/cloudcell-consultant` | `domains` | NER | `ai_tools` |
| `work/the-link` | `domains` | NER | `ai_tools` |
| `work/upwork-software-test` | `domains` | Agile | `soft_skills` |
| `work/forumapi` | `domains` | Agile | `soft_skills` |
| `work/forumapi` | `domains` | NER | `ai_tools` |
| `work/publix` | `domains` | Public Speaking | `soft_skills` |
| `pub/phd-dissertation` | `domains` | Agile | `soft_skills` |
| `pub/towards-agile-academia` | `domains` | Agile | `soft_skills` |
| `pub/scrum-in-classroom` | `domains` | Agile | `soft_skills` |
| `pub/digital-rubber-duck` | `domains` | Agile | `soft_skills` |
| `pub/microelectronic-ai-dishonesty` | `domains` | Agile | `soft_skills` |
| `pub/interpersonal-chemistry-agile` | `domains` | Agile | `soft_skills` |
| `proj/biomed-paper-extractor` | `domains` | NER | `ai_tools` |
| `proj/biomed-paper-extractor` | `domains` | VLM | `ai_tools` |
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
