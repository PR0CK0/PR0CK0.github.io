#!/usr/bin/env python3
"""Add domains to pubs 11-40. Technologies left for PDF review pass."""
import yaml

YAML_PATHS = ["data/tyler-procko.yaml", "public/data/tyler-procko.yaml"]

DOMAINS = {
    "pub/robust-training-datasets-ontologies":
        ["Ontology", "Machine Learning", "Computer Vision", "Knowledge Representation"],
    "pub/prov-o-bfo-mapping":
        ["Ontology", "Provenance", "Semantic Web", "Linked Data", "Knowledge Representation"],
    "pub/semantic-science-beyond-pdf":
        ["Semantic Web", "Linked Data", "Scientific Writing", "Knowledge Graphs"],
    "pub/dawn-of-dialogue":
        ["LLMs", "Machine Learning"],
    "pub/lm-kg-survey":
        ["Knowledge Graphs", "LLMs", "NLP", "Machine Learning", "Semantic Web"],
    "pub/towards-agile-academia":
        ["Agile", "Scientific Writing", "Software Engineering"],
    "pub/scrum-in-classroom":
        ["Agile", "Education", "Software Engineering"],
    "pub/gps-signal-strength":
        ["Cybersecurity", "Aerospace", "Networking"],
    "pub/auto-code-documentation":
        ["LLMs", "Software Engineering", "NLP", "Prompt Engineering"],
    "pub/gpt4-stochastic-parrot":
        ["LLMs", "Ontology", "Knowledge Representation", "Knowledge Graphs"],
    "pub/auto-bfo-aristotelian-definitions":
        ["Ontology", "LLMs", "Knowledge Representation", "Semantic Web", "Prompt Engineering"],
    "pub/catastrophic-forgetting":
        ["Machine Learning", "LLMs"],
    "pub/digital-rubber-duck":
        ["LLMs", "Software Engineering", "Agile", "Prompt Engineering"],
    "pub/swebok-kg-transformer":
        ["Knowledge Graphs", "NLP", "Software Engineering", "Taxonomy", "Text Extraction"],
    "pub/microelectronic-ai-dishonesty":
        ["Machine Learning", "Agile", "Education", "Software Engineering"],
    "pub/interpersonal-chemistry-agile":
        ["Agile", "Education", "Software Engineering"],
    "pub/validating-security-requirements-kg":
        ["Knowledge Graphs", "Cybersecurity", "Requirements Engineering", "Software Engineering"],
    "pub/ontology-sdlc-aerospace":
        ["Ontology", "SDLC", "Aerospace", "SQA", "Software Engineering"],
    "pub/explainable-ml-semantic-web":
        ["XAI", "Semantic Web", "Machine Learning", "Linked Data"],
    "pub/secure-development-ontology":
        ["Ontology", "Cybersecurity", "Requirements Engineering", "Software Engineering", "SDLC"],
    "pub/vr-software-requirements":
        ["Requirements Engineering", "Software Engineering", "Education"],
    "pub/ml-misbehaviors-taxonomy":
        ["Machine Learning", "Taxonomy", "Software Engineering", "SQA"],
    "pub/kg-geospatial-sumo":
        ["Knowledge Graphs", "Geospatial", "Computer Vision", "Ontology"],
    "pub/sdlc-ontology-engineering":
        ["Ontology", "SDLC", "Software Engineering"],
    "pub/cognitive-assistants-aviation-inprogress":
        ["Aerospace", "Machine Learning", "LLMs"],
    "pub/colleague-thesis-vonderhaar":
        ["Knowledge Graphs", "Cybersecurity", "Requirements Engineering", "Software Engineering"],
    "pub/colleague-thesis-kiselev":
        ["Knowledge Graphs", "Software Engineering", "Education", "NLP", "Text Extraction"],
    "pub/competition-proposal-nas":
        ["Aerospace", "Machine Learning", "Knowledge Graphs", "LLMs"],
    "pub/grant-proposal-nsf":
        ["Education", "Software Engineering", "Cybersecurity"],
    "pub/article-synthetic-ontologies":
        ["Ontology", "Knowledge Representation", "LLMs"],
}

for path in YAML_PATHS:
    with open(path) as f:
        data = yaml.safe_load(f)
    for pub in data.get("publications") or []:
        domains = DOMAINS.get(pub["id"])
        if domains:
            pub["domains"] = domains
            print(f"  {pub['id']}")
    with open(path, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

print("Done.")
