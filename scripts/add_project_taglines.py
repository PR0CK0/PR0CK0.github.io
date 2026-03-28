#!/usr/bin/env python3
"""Add curated taglines to projects in the YAML."""
import yaml

YAML_PATH = "data/tyler-procko.yaml"
PUBLIC_PATH = "public/data/tyler-procko.yaml"

TAGLINES = {
    "proj/ai-landscape-digest":         "Your local AI release feed, summarized on login — powered by whatever LLM CLI you have.",
    "proj/biomed-paper-extractor":       "End-to-end biomedical paper analysis: VLM figure digitization + NER. Gradio UI on HuggingFace Spaces.",
    "proj/health-optimization-kg":       "BFO-aligned, evidence-graded knowledge graph for health optimization interventions.",
    "proj/ocsf-visualizer":              "Browser-based Cytoscape.js interactive graph view of the Open Cybersecurity Schema Framework.",
    "proj/bfo-wikidata-classifier":      "Transformer-based hierarchical classifier mapping Wikidata entities to BFO classes.",
    "proj/bert-benchmarking":            "Benchmarks BERT variants on inference speed, memory, and size for compute-constrained deployments.",
    "proj/bfobert":                      "Fine-tunes DistilBERT to classify ontology terms as Continuant or Occurrent under BFO.",
    "proj/dissenter":                    "Run multiple LLMs through a structured debate, surface disagreements, synthesize a decision.",
    "proj/provtracer":                   "Automatically captures digital artifact provenance using a multimodal LLM and knowledge graph serialization.",
    "proj/stable-diffusion-testing":     "End-to-end guide for Stable Diffusion — from setup through LoRA fine-tuning.",
    "proj/nlp-optimization":             "Optimization of NLP vectorization on large corpora using Numba, Cython, and MPI.",
    "proj/bfo-buddy":                    "CLI tool for bootstrapping ontology development with the Basic Formal Ontology (BFO).",
    "proj/usa-obesity-visualization":    "Data analysis and Tableau visualization of USA obesity rates by state.",
    "proj/upper-martial-arts-ontology":  "OWL ontology modeling the upper-level concepts of martial arts disciplines.",
    "proj/volusia-elevation-qgis":       "Finding parcel elevations across Volusia County, FL using PostGIS and QGIS.",
    "proj/meme-ontology":                "Crawls KnowYourMeme.com confirmed memes into a knowledge graph (MEMO — the Meme Ontology).",
    "proj/vxworks-water-heater":         "Simulates a water heater in C using VxWorks threads, mutexes, semaphores, and watchdogs.",
    "proj/lan-board-game":               "LAN-capable multiplayer SOS board game in Java with a Swing GUI.",
    "proj/monster-hunter-world":         "Java + SQL app for searching Monster Hunter: World items, monsters, and building armor sets.",
    "proj/eagle-listings":               "Campus marketplace app built in Java with a Swing GUI and MySQL backend.",
    "proj/tiles-game":                   "JavaFX sliding tile puzzle game.",
    "proj/text-racing-game":             "CLI text-based racing game in C.",
    "proj/personal":                     "Personal creative and hobby projects spanning 3D modeling, photo/video editing, and game design.",
}

with open(YAML_PATH) as f:
    data = yaml.safe_load(f)

updated = 0
for p in data.get("projects", []):
    tag = TAGLINES.get(p["id"])
    if tag and p.get("tagline") != tag:
        p["tagline"] = tag
        updated += 1

print(f"Updated {updated} projects with taglines.")

for path in (YAML_PATH, PUBLIC_PATH):
    with open(path, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

print("Done.")
