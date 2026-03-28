#!/usr/bin/env python3
"""Batch 2: publications 6-10."""
import yaml

YAML_PATHS = ["data/tyler-procko.yaml", "public/data/tyler-procko.yaml"]

PUB_UPDATES = {
    "pub/requirements-elicitation-ml": {
        "technologies": ["Microsoft Word", "Microsoft Teams"],
        "domains": ["Machine Learning", "Requirements Engineering", "Software Engineering"],
    },
    "pub/leveraging-llms-scientific-writing": {
        "technologies": ["Microsoft Word", "Microsoft Teams"],
        "domains": ["LLMs", "Scientific Writing", "Prompt Engineering"],
    },
    "pub/graph-rag-survey": {
        "technologies": ["Microsoft Word", "Microsoft Teams"],
        "domains": ["Knowledge Graphs", "LLMs", "RAG", "Semantic Web"],
    },
    "pub/cognitive-assistants-single-pilot": {
        "technologies": ["Microsoft Word", "Microsoft Teams"],
        "domains": ["Aerospace"],
    },
    "pub/linked-data-aerospace": {
        "technologies": ["Microsoft Word", "Microsoft Teams"],
        "domains": ["Linked Data", "Knowledge Graphs", "Semantic Web", "Aerospace"],
    },
}

for path in YAML_PATHS:
    with open(path) as f:
        data = yaml.safe_load(f)
    for pub in data.get("publications") or []:
        u = PUB_UPDATES.get(pub["id"])
        if u:
            pub["technologies"] = u["technologies"]
            pub["domains"] = u["domains"]
            print(f"  {pub['id']}")
    with open(path, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

print("Done.")
