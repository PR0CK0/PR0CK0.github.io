#!/usr/bin/env python3
"""
Migrate skill tiers: move paradigm/soft_skill/personal items out of
`technologies` arrays and into the new `domains`, `soft_skills`,
`personal_skills` fields on each entity.
"""
import yaml

YAML_PATHS = [
    "data/tyler-procko.yaml",
    "public/data/tyler-procko.yaml",
]

# Strings that belong in `domains` (research paradigms)
DOMAIN_TERMS = {
    "Knowledge Graphs", "Text Extraction", "ML Provenance", "Semantic Web",
    "Machine Learning", "XAI", "Computer Vision", "Linked Data", "Cybersecurity",
    "SQA", "Ontology", "Ontology Engineering", "Description Logics", "FOL", "HOL",
    "LLMs", "FAIR AI", "Provenance", "Knowledge Representation", "Cryptography",
    "Networking", "Embedded Systems", "Real-Time Systems", "Cluster Analysis",
    "Web Scraping", "Game Development", "AR", "NLP", "NER", "VLM",
}

# Strings that belong in `soft_skills`
SOFT_SKILL_TERMS = {
    "Systems Engineering",
}

# Strings that belong in `personal_skills`
PERSONAL_SKILL_TERMS = {
    "Adobe Photoshop", "Adobe Illustrator", "Adobe After Effects",
    "AutoCAD LTE", "Google SketchUp", "sqlite3", "Devise",
}

ENTITY_KEYS = ["work_experiences", "publications", "projects", "courses", "extracurriculars"]


def migrate_entity(entity: dict) -> bool:
    techs = entity.get("technologies") or []
    if not techs:
        return False

    keep, domains, soft, personal = [], [], [], []
    for t in techs:
        if t in DOMAIN_TERMS:
            domains.append(t)
        elif t in SOFT_SKILL_TERMS:
            soft.append(t)
        elif t in PERSONAL_SKILL_TERMS:
            personal.append(t)
        else:
            keep.append(t)

    changed = len(keep) != len(techs)
    if changed:
        if keep:
            entity["technologies"] = keep
        else:
            entity.pop("technologies", None)
        if domains:
            entity["domains"] = sorted(set((entity.get("domains") or []) + domains))
        if soft:
            entity["soft_skills"] = sorted(set((entity.get("soft_skills") or []) + soft))
        if personal:
            entity["personal_skills"] = sorted(set((entity.get("personal_skills") or []) + personal))
    return changed


def main():
    for path in YAML_PATHS:
        with open(path) as f:
            data = yaml.safe_load(f)

        moved = 0
        for key in ENTITY_KEYS:
            for entity in data.get(key) or []:
                if migrate_entity(entity):
                    moved += 1

        with open(path, "w") as f:
            yaml.dump(data, f, allow_unicode=True, sort_keys=False,
                      default_flow_style=False, width=120)

        print(f"{path}: migrated {moved} entities")


if __name__ == "__main__":
    main()
