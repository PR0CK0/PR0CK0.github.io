#!/usr/bin/env python3
"""Add 'Virtual Presentation' soft skill to specified entities."""
import yaml

YAML_PATHS = ["data/tyler-procko.yaml", "public/data/tyler-procko.yaml"]

ENTITY_KEYS = ["work_experiences", "publications", "projects", "courses", "extracurriculars", "talks"]

TARGET_IDS = {
    # Publications
    "pub/leveraging-llms-scientific-writing",
    "pub/graph-rag-survey",
    "pub/semantic-science-beyond-pdf",
    "pub/auto-code-documentation",
    "pub/gpt4-stochastic-parrot",
    "pub/auto-bfo-aristotelian-definitions",
    "pub/explainable-ml-semantic-web",
    # Work
    "work/stealth-startup",
    "work/afrl-2023",
    "work/afrl-2021",
    "work/afrl-2020",
    "work/cloudcell-consultant",
    "work/upwork-reasoning",
    "work/upwork-ontology-engineer-2024",
    "work/upwork-nuclear",
    "work/quiet-professionals",
    "work/hooray-media",
    "work/the-link",
    "work/upwork-legal",
    "work/upwork-software-test",
    "work/upwork-geospatial",
    "work/upwork-kg-engineer",
    "work/forumapi",
    "work/wordlift",
    "work/eram-research-team",
    # Talk
    "talk/powering-ai-ontology-construction",
}

SKILL = "Virtual Presentation"

for path in YAML_PATHS:
    with open(path) as f:
        data = yaml.safe_load(f)

    for key in ENTITY_KEYS:
        for entity in data.get(key) or []:
            eid = entity.get("id")
            if eid in TARGET_IDS:
                existing = entity.get("soft_skills") or []
                if SKILL not in existing:
                    entity["soft_skills"] = existing + [SKILL]
                    print(f"  +VP {eid}")

    with open(path, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

print("Done.")
