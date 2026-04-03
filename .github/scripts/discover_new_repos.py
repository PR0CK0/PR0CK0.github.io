"""
Auto-discovers new public GitHub repos and adds skeleton project entries to
public/data/tyler-procko.yaml.

Queries the GitHub API for all public, non-forked repos owned by GITHUB_USER.
Any repo whose html_url isn't already tracked as a project repo_url gets an
entry appended to the projects list. Repos without a GitHub "About" description
are skipped — they're usually incomplete or throwaway.

Technologies are auto-populated from the repo's GitHub languages and topics,
mapped through a known vocabulary. Domains are inferred from topics where
possible. Both can be refined manually after the PR is merged.

Usage:
    GITHUB_TOKEN=<token> python3 .github/scripts/discover_new_repos.py

Exit codes:
    0 — completed (with or without changes)
    1 — fatal error
"""

from __future__ import annotations

import os
import re
import sys
import time
import urllib.request
import urllib.error
import json

try:
    from ruamel.yaml import YAML
    from ruamel.yaml.comments import CommentedMap
except ImportError:
    print("ERROR: ruamel.yaml is required. Install with: pip install ruamel.yaml")
    sys.exit(1)

YAML_PATH = "public/data/tyler-procko.yaml"
GITHUB_USER = "PR0CK0"
TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_RE = re.compile(r"https://github\.com/([^/]+)/([^/\s]+?)/?$")

# GitHub language name → YAML technology name (pass-through if not listed)
LANGUAGE_MAP: dict[str, str] = {
    "JavaScript":   "JavaScript",
    "TypeScript":   "TypeScript",
    "Python":       "Python",
    "Java":         "Java",
    "C":            "C",
    "C++":          "C++",
    "C#":           "C#",
    "HTML":         "HTML",
    "CSS":          "CSS",
    "Shell":        "Bash",
    "Dockerfile":   "Docker",
    "Jupyter Notebook": "Jupyter",
    "SPARQL":       "SPARQL",
    "Turtle":       "Turtle",
}

# GitHub topic → YAML technology name
TOPIC_TECH_MAP: dict[str, str] = {
    "python":           "Python",
    "javascript":       "JavaScript",
    "typescript":       "TypeScript",
    "react":            "React",
    "nodejs":           "Node.js",
    "docker":           "Docker",
    "pytorch":          "PyTorch",
    "tensorflow":       "TensorFlow",
    "transformers":     "Transformers",
    "spacy":            "spaCy",
    "rdf":              "RDF",
    "owl":              "OWL",
    "sparql":           "SPARQL",
    "turtle":           "Turtle",
    "ontology":         "OWL",
    "graphdb":          "GraphDB",
    "protege":          "Protégé",
    "bfo":              "BFO",
    "neo4j":            "Neo4j",
    "cytoscape":        "Cytoscape.js",
    "github-actions":   "GitHub Actions",
    "ollama":           "Ollama",
    "fastapi":          "FastAPI",
    "flask":            "Flask",
    "unity":            "Unity",
    "arduino":          "Arduino",
    "mysql":            "MySQL",
    "postgresql":       "PostgreSQL",
    "vite":             "Vite",
    "tailwindcss":      "Tailwind CSS",
}

# GitHub topic → YAML domain name
TOPIC_DOMAIN_MAP: dict[str, str] = {
    "machine-learning":         "Machine Learning",
    "deep-learning":            "Machine Learning",
    "nlp":                      "NLP",
    "natural-language-processing": "NLP",
    "knowledge-graph":          "Knowledge Graphs",
    "ontology":                 "Ontology",
    "semantic-web":             "Semantic Web",
    "linked-data":              "Linked Data",
    "knowledge-representation": "Knowledge Representation",
    "computer-vision":          "Computer Vision",
    "llm":                      "LLMs",
    "large-language-model":     "LLMs",
    "rag":                      "Retrieval-Augmented Generation",
    "aviation":                 "Aviation",
    "cybersecurity":            "Cybersecurity",
    "game-development":         "Game Development",
    "data-analysis":            "Data Analysis",
    "software-engineering":     "Software Engineering",
    "web-development":          "Web Development",
    "taxonomy":                 "Taxonomy",
    "provenance":               "ML Provenance",
    "safety":                   "Safety",
}


def gh_get(path: str) -> dict | list | None:
    url = f"https://api.github.com{path}"
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} for {path}")
        return None
    except Exception as e:
        print(f"  Error fetching {path}: {e}")
        return None


def fetch_all_repos() -> list[dict]:
    repos: list[dict] = []
    page = 1
    while True:
        batch = gh_get(f"/users/{GITHUB_USER}/repos?type=public&per_page=100&page={page}")
        if not batch:
            break
        repos.extend(r for r in batch if not r.get("fork"))
        if len(batch) < 100:
            break
        page += 1
        time.sleep(0.2)
    return repos


def infer_technologies(owner: str, repo_name: str, topics: list[str]) -> list[str]:
    """Fetch repo languages + map topics → technology list."""
    techs: list[str] = []
    seen: set[str] = set()

    # Languages from GitHub
    langs = gh_get(f"/repos/{owner}/{repo_name}/languages") or {}
    time.sleep(0.15)
    for lang in langs:
        mapped = LANGUAGE_MAP.get(lang, lang)
        if mapped not in seen:
            techs.append(mapped)
            seen.add(mapped)

    # Topics → tech
    for topic in topics:
        mapped = TOPIC_TECH_MAP.get(topic)
        if mapped and mapped not in seen:
            techs.append(mapped)
            seen.add(mapped)

    return techs


def infer_domains(topics: list[str]) -> list[str]:
    domains: list[str] = []
    seen: set[str] = set()
    for topic in topics:
        mapped = TOPIC_DOMAIN_MAP.get(topic)
        if mapped and mapped not in seen:
            domains.append(mapped)
            seen.add(mapped)
    return domains


def repo_slug(name: str) -> str:
    return re.sub(r"[_\s]+", "-", name).lower()


def repo_title(name: str) -> str:
    return re.sub(r"[-_]+", " ", name).strip()


def normalize_url(url: str) -> str:
    return (url or "").strip().rstrip("/").lower()


def make_entry(repo: dict, owner: str) -> CommentedMap:
    topics = repo.get("topics") or []
    techs  = infer_technologies(owner, repo["name"], topics)
    domains = infer_domains(topics)

    entry = CommentedMap()
    entry["id"]       = f"proj/{repo_slug(repo['name'])}"
    entry["title"]    = repo_title(repo["name"])
    date_str          = repo.get("pushed_at") or repo.get("created_at") or ""
    entry["year"]     = date_str[:7] if date_str else ""
    entry["repo_url"] = repo["html_url"]
    if repo.get("homepage"):
        entry["url"] = repo["homepage"]
    if repo.get("description"):
        entry["description"] = repo["description"]
    if techs:
        entry["technologies"] = techs
    if domains:
        entry["domains"] = domains
    return entry


def main() -> None:
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 120

    with open(YAML_PATH, encoding="utf-8") as f:
        data = yaml.load(f)

    projects = data.get("projects") or []

    existing_urls: set[str] = set()
    for p in projects:
        if p.get("repo_url"):
            existing_urls.add(normalize_url(p["repo_url"]))
    for e in data.get("extracurriculars") or []:
        if "github.com" in (e.get("url") or ""):
            existing_urls.add(normalize_url(e["url"]))

    print(f"Fetching public repos for {GITHUB_USER} ...")
    gh_repos = fetch_all_repos()
    print(f"Found {len(gh_repos)} public non-fork repos on GitHub")

    m = REPO_RE.match(f"https://github.com/{GITHUB_USER}/x")
    owner = GITHUB_USER

    added = 0
    for repo in gh_repos:
        url = normalize_url(repo["html_url"])
        if url in existing_urls:
            continue

        if not (repo.get("description") or "").strip():
            print(f"  SKIP (no description): {repo['name']}")
            continue

        m2 = REPO_RE.match(repo["html_url"])
        repo_owner = m2.group(1) if m2 else owner

        print(f"  NEW: proj/{repo_slug(repo['name'])} — {repo['html_url']}")
        entry = make_entry(repo, repo_owner)
        projects.append(entry)
        existing_urls.add(url)
        added += 1
        time.sleep(0.1)

    if added:
        with open(YAML_PATH, "w", encoding="utf-8") as f:
            yaml.dump(data, f)
        print(f"\n✓ {added} new project(s) added to {YAML_PATH}")
    else:
        print("\nNo new repos found.")


if __name__ == "__main__":
    main()
