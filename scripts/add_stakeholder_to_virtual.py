#!/usr/bin/env python3
"""Add 'Stakeholder Presentation' everywhere 'Virtual Presentation' exists."""
import yaml

YAML_PATHS = ["data/tyler-procko.yaml", "public/data/tyler-procko.yaml"]
ENTITY_KEYS = ["work_experiences", "publications", "projects", "courses", "extracurriculars", "talks"]

for path in YAML_PATHS:
    with open(path) as f:
        data = yaml.safe_load(f)

    for key in ENTITY_KEYS:
        for entity in data.get(key) or []:
            ss = entity.get("soft_skills") or []
            if "Virtual Presentation" in ss and "Stakeholder Presentation" not in ss:
                entity["soft_skills"] = ss + ["Stakeholder Presentation"]
                print(f"  +SP {entity.get('id')}")

    with open(path, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

print("Done.")
