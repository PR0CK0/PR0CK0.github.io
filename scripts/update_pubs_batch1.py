#!/usr/bin/env python3
"""
Batch 1: update publications 1-5, global fixes.
- Replace 'Ontology Engineering' → 'Ontology' in all domains arrays everywhere
- Add new domain terms to any existing domains arrays (no-op if already present)
- Set exact technologies + domains for pubs 1-5
"""
import yaml

YAML_PATHS = ["data/tyler-procko.yaml", "public/data/tyler-procko.yaml"]

ENTITY_KEYS = ["work_experiences", "publications", "projects", "courses", "extracurriculars"]

# Pub-specific overrides
PUB_UPDATES = {
    "pub/prompt-provenance": {
        "technologies": ["Microsoft Word", "Microsoft Teams", "PROV-O", "RDF", "RDFS", "OWL", "Draw.io"],
        "domains": ["Knowledge Graphs", "Linked Data", "Semantic Web", "XAI", "Provenance", "ML Provenance", "LLMs", "Prompt Engineering"],
    },
    "pub/ml-lifecycle-provenance-survey": {
        "technologies": ["Microsoft Word", "Microsoft Teams", "PROV-O", "PROV-ML", "RDF", "RDFS", "OWL", "MLSchema", "MEX", "OntoDM", "ANNETTO"],
        "domains": ["Ontology", "XAI", "Semantic Web", "Linked Data", "Provenance", "ML Provenance", "Machine Learning", "LLMs"],
    },
    "pub/verifying-ml-interpretability": {
        "technologies": ["Microsoft Word", "Microsoft Teams", "PROV-O"],
        "domains": ["Semantic Web", "Linked Data", "XAI", "Provenance", "ML Provenance", "Machine Learning"],
    },
    "pub/creating-robust-datasets": {
        "technologies": ["Microsoft Word", "Microsoft Teams"],
        "domains": ["Ontology", "Machine Learning", "Computer Vision", "Knowledge Representation"],
    },
    "pub/exploring-testing-llms": {
        "technologies": ["Microsoft Word", "Microsoft Teams"],
        "domains": ["LLMs", "SQA", "Machine Learning", "Prompt Engineering"],
    },
}


def fix_domains(entity: dict):
    """Replace 'Ontology Engineering' with 'Ontology' in domains."""
    domains = entity.get("domains")
    if not domains:
        return
    entity["domains"] = ["Ontology" if d == "Ontology Engineering" else d for d in domains]


def main():
    for path in YAML_PATHS:
        with open(path) as f:
            data = yaml.safe_load(f)

        # Global fix: Ontology Engineering → Ontology across all entities
        for key in ENTITY_KEYS:
            for entity in data.get(key) or []:
                fix_domains(entity)

        # Pub-specific updates
        for pub in data.get("publications") or []:
            update = PUB_UPDATES.get(pub["id"])
            if update:
                pub["technologies"] = update["technologies"]
                pub["domains"] = update["domains"]
                print(f"  updated {pub['id']}")

        with open(path, "w") as f:
            yaml.dump(data, f, allow_unicode=True, sort_keys=False,
                      default_flow_style=False, width=120)

    print("Done.")


if __name__ == "__main__":
    main()
