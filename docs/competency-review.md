# Competency classification review

The original 2026-11-04 migration preserved 374 labels and categories. After the NLP and RAG consolidations, the catalog has 372 terms and no outstanding field/category placements. Views consistently use the catalog category even when a record stores a reference under a different field.

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

## Resolved: Agile

`Agile` is categorized under Research Domains, reflecting the Agile methods covered by the portfolio's work, research, projects, and courses. Its label, `agile` ID, references, and all 14 supporting connections are preserved. The records already placed it in `domains`; the catalog now agrees. Agile follows the existing CV/resume domain-exclusion policy and no longer appears in its Soft Skills group.

## Resolved: Public Speaking

The Publix record now places Public Speaking in `soft_skills`, matching the catalog and the other records. Its label, ID, supporting records, and display category are unchanged.

## Stored references

Portfolio competency fields use the full canonical labels for Natural Language Processing, Named Entity Recognition, Vision-Language Models, and Retrieval-Augmented Generation. The 33 abbreviated values were normalized (27 NLP, five NER, one VLM); all seven RAG references already used the full name. Helper reference lists and the project-analysis prompt use those same names. A regression test guards these stored references against abbreviated values returning.

Stable IDs and alias mappings remain for existing links. Prose descriptions, titles, repository URLs, and other record fields retain their original wording. This normalization changes neither graph connections nor evidence counts.

## Resolved: Personal tools

The nine tools below are categorized as Personal & Creative Use, matching their existing `personal_skills` references on **Personal & Creative Work**. Here, Personal & Creative Use describes the owner's experience outside professional or academic work, rather than the tool's technical type. Their names, IDs, aliases, and references are preserved.

| Term | Previous catalog category | Current category | Supporting record |
|---|---|---|---|
| Topaz Video AI | AI Tools | Personal & Creative Use | Personal & Creative Work |
| Ruby/Rails | Programming Languages | Personal & Creative Use | Personal & Creative Work |
| TriplyDB | Development Tools | Personal & Creative Use | Personal & Creative Work |
| Kubernetes | Development Tools | Personal & Creative Use | Personal & Creative Work |
| GoDaddy | Cloud & Deployment | Personal & Creative Use | Personal & Creative Work |
| LucidChart | Design & Analysis Tools | Personal & Creative Use | Personal & Creative Work |
| Google Cloud Platform | Cloud & Deployment | Personal & Creative Use | Personal & Creative Work |
| Heroku | Cloud & Deployment | Personal & Creative Use | Personal & Creative Work |
| Ontotext Refine | Development Tools | Personal & Creative Use | Personal & Creative Work |

Each has exactly one reference, on this record. Personal & Creative Work and its 19 Personal & Creative Use tools are now included in the graph and homepage counts. Its `cv_exclude` flag still excludes the project from both CV and resume; personal-category skills remain excluded from their skill groups. The five other previously hidden projects have explicit `graph_exclude` flags, keeping their website visibility unchanged. Technical Writing and Scientific Writing remain distinct.

## Resolved: Telegram

Telegram is categorized as Communication Tools, retaining its `telegram` ID. Its reference was removed from Personal & Creative Work and moved into `technologies` on the Christian Denominations Wikidata project. That project supplies its only connection. The personal category key stays `personal`; its displayed section name is **Personal & Creative Use**.

## Review status

All recorded field/category disagreements are resolved. Run `python3 .github/scripts/validate_yaml_terms.py` to check future references. Categories are global: if a personal tool gains professional or academic evidence later, review its classification explicitly rather than changing it based on the containing record alone.
