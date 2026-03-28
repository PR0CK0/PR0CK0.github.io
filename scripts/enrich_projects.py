#!/usr/bin/env python3
"""
Enrich project technologies from GitHub:
  - Adds 'GitHub' to any project with a repo_url on github.com
  - Fetches repo languages via GitHub API
  - Fetches requirements.txt / package.json to detect libraries
  - Only adds techs that are already mapped in tech-categories.ts
"""

import json
import re
import time
import urllib.request
import urllib.error
import yaml

YAML_PATH = "data/tyler-procko.yaml"
PUBLIC_YAML_PATH = "public/data/tyler-procko.yaml"
TECH_CAT_PATH = "src/lib/tech-categories.ts"

# ── Map GitHub language names → our tech strings ──────────────────────────────
LANGUAGE_MAP = {
    "Python":           "Python",
    "JavaScript":       "JavaScript",
    "TypeScript":       "TypeScript",
    "Java":             "Java",
    "C":                "C",
    "C#":               "C#",
    "Ruby":             "Ruby",
    "HTML":             "HTML",
    "CSS":              "CSS",
    "R":                "R",
    "Fortran":          "Fortran",
    "Julia":            "Julia",
    "Racket":           "Racket",
    "SPARQL":           "SPARQL",
    "Turtle":           "Turtle",
}

# ── Map pip package names → our tech strings ─────────────────────────────────
REQUIREMENTS_MAP = {
    "numpy":                "NumPy",
    "pandas":               "Pandas",
    "matplotlib":           "Matplotlib",
    "seaborn":              "Seaborn",
    "plotly":               "Plotly",
    "torch":                "PyTorch",
    "pytorch":              "PyTorch",
    "tensorflow":           "TensorFlow",
    "scikit-learn":         "scikit-learn",
    "sklearn":              "scikit-learn",
    "nltk":                 "NLTK",
    "spacy":                "spaCy",
    "scispacy":             "scispaCy",
    "transformers":         "Transformers",
    "sentence-transformers":"sentence-transformers",
    "rdflib":               "RDFLib",
    "sparqlwrapper":        "SPARQLWrapper",
    "llama-index":          "LlamaIndex",
    "llama_index":          "LlamaIndex",
    "litellm":              "LiteLLM",
    "gradio":               "Gradio",
    "streamlit":            "Streamlit",
    "fastapi":              "FastAPI",
    "pydantic":             "Pydantic",
    "pymupdf":              "PyMuPDF",
    "fitz":                 "PyMuPDF",
    "beautifulsoup4":       "BeautifulSoup4",
    "bs4":                  "BeautifulSoup4",
    "feedparser":           "feedparser",
    "pyyaml":               "PyYAML",
    "typer":                "Typer",
    "rich":                 "Rich",
    "pyqt6":                "PyQt6",
    "anthropic":            "Anthropic SDK",
    "openai":               "OpenAI",
    "pyvis":                "PyVis",
    "pdfplumber":           "pdfplumber",
    "pypdf2":               "PyPDF2",
    "numba":                "Numba",
    "numexpr":              "Numexpr",
    "cython":               "Cython",
    "mpi4py":               "mpi4py",
    "gliner":               "GLiNER",
    "flair":                "Flair",
    "cytoscape":            "Cytoscape.js",
    "pyaml":                "PyYAML",
}

# ── Map npm package names → our tech strings ─────────────────────────────────
NPM_MAP = {
    "react":            "React",
    "vite":             "Vite",
    "typescript":       "TypeScript",
    "fastify":          "Fastify",
    "cytoscape":        "Cytoscape.js",
    "anthropic":        "Anthropic SDK",
    "openai":           "OpenAI API",
}


def load_known_techs(path: str) -> set[str]:
    """Parse all keys from TECH_CATEGORIES in tech-categories.ts."""
    with open(path) as f:
        content = f.read()
    # Match quoted or unquoted keys before the colon
    keys = re.findall(r"^\s+['\"]?([^'\":,\n]+)['\"]?\s*:", content, re.MULTILINE)
    return {k.strip().strip("'\"") for k in keys if k.strip()}


def gh_api(path: str):
    url = f"https://api.github.com{path}"
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "procko-enricher"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        print(f"  HTTP {e.code} for {url}")
        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None


def get_file_content(owner: str, repo: str, filename: str):
    import base64
    data = gh_api(f"/repos/{owner}/{repo}/contents/{filename}")
    if data and isinstance(data, dict) and data.get("encoding") == "base64":
        return base64.b64decode(data["content"]).decode("utf-8", errors="ignore")
    return None


def parse_requirements(content: str) -> set[str]:
    techs = set()
    for line in content.splitlines():
        line = line.strip().lower()
        if not line or line.startswith("#"):
            continue
        # Strip version specifiers
        pkg = re.split(r"[>=<!;\[]", line)[0].strip().replace("-", "-").replace("_", "-")
        pkg_under = pkg.replace("-", "_")
        for key in (pkg, pkg_under, pkg.replace("-", "")):
            if key in REQUIREMENTS_MAP:
                techs.add(REQUIREMENTS_MAP[key])
                break
    return techs


def parse_package_json(content: str) -> set[str]:
    techs = set()
    try:
        data = json.loads(content)
        all_deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        for pkg in all_deps:
            key = pkg.lower().lstrip("@").split("/")[-1]
            if key in NPM_MAP:
                techs.add(NPM_MAP[key])
    except Exception:
        pass
    return techs


def extract_owner_repo(url: str):
    m = re.search(r"github\.com/([^/]+)/([^/\s]+)", url)
    if m:
        return m.group(1), m.group(2).rstrip("/").replace(".git", "")
    return None


def enrich_project(project: dict, known_techs: set[str]) -> list[str]:
    """Return list of new techs to add (not already present)."""
    repo_url = project.get("repo_url") or project.get("url", "")
    if "github.com" not in repo_url:
        return []

    existing = set(project.get("technologies") or [])
    to_add: set[str] = set()

    # Always add GitHub
    if "GitHub" not in existing:
        to_add.add("GitHub")

    parsed = extract_owner_repo(repo_url)
    if not parsed:
        return sorted(to_add)
    owner, repo = parsed

    print(f"  Fetching {owner}/{repo}...")
    time.sleep(0.4)  # stay well under 60 req/min unauthenticated

    # Languages
    langs = gh_api(f"/repos/{owner}/{repo}/languages")
    if langs and isinstance(langs, dict):
        for gh_lang in langs:
            mapped = LANGUAGE_MAP.get(gh_lang)
            if mapped and mapped in known_techs and mapped not in existing:
                to_add.add(mapped)

    # requirements.txt
    req_content = get_file_content(owner, repo, "requirements.txt")
    if req_content:
        for tech in parse_requirements(req_content):
            if tech in known_techs and tech not in existing:
                to_add.add(tech)

    # package.json
    pkg_content = get_file_content(owner, repo, "package.json")
    if pkg_content:
        for tech in parse_package_json(pkg_content):
            if tech in known_techs and tech not in existing:
                to_add.add(tech)

    return sorted(to_add)


def main():
    with open(YAML_PATH) as f:
        data = yaml.safe_load(f)

    known_techs = load_known_techs(TECH_CAT_PATH)
    print(f"Loaded {len(known_techs)} known techs from tech-categories.ts\n")

    changed = 0
    for project in data.get("projects", []):
        repo_url = project.get("repo_url") or project.get("url", "")
        if "github.com" not in repo_url:
            continue

        print(f"[{project['id']}] {project.get('title', '')}")
        additions = enrich_project(project, known_techs)

        if additions:
            existing = list(project.get("technologies") or [])
            project["technologies"] = existing + additions
            print(f"  + {additions}")
            changed += 1
        else:
            print(f"  (nothing new)")

    print(f"\nUpdated {changed} projects.")

    with open(YAML_PATH, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

    with open(PUBLIC_YAML_PATH, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

    print("Wrote updated YAML.")


if __name__ == "__main__":
    main()
