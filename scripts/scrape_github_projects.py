#!/usr/bin/env python3
"""
Scrape every project with a GitHub URL, collect repo metadata (languages,
topics, README, requirements.txt, package.json, setup.py), then use the
Claude API to infer domains, technologies, and libraries for each.

Outputs:
  scrapes/<project-id>.json   — raw GitHub data
  scrapes/<project-id>_analysis.json — Claude's structured inference
  scrapes/report.txt          — diff-style summary of planned additions

Does NOT write back to YAML automatically.

Usage:
  pip install anthropic pyyaml requests
  ANTHROPIC_API_KEY=sk-... python3 scripts/scrape_github_projects.py
  # Optional: GITHUB_TOKEN=ghp_... for higher rate limits
"""

import base64
import json
import os
import re
import sys
import time
from pathlib import Path

import anthropic
import requests
import yaml

# ── Config ────────────────────────────────────────────────────────────────────
YAML_PATH = "data/tyler-procko.yaml"
SCRAPES_DIR = Path("scrapes")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

HEADERS = {"Accept": "application/vnd.github+json"}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"

# Known domain/technology vocabulary (for the diff report context)
KNOWN_DOMAINS = {
    "Knowledge Graphs", "Text Extraction", "ML Provenance", "Semantic Web",
    "Machine Learning", "XAI", "Computer Vision", "Linked Data", "Cybersecurity",
    "SQA", "Ontology", "Description Logics", "FOL", "HOL", "LLMs", "FAIR AI",
    "Provenance", "Knowledge Representation", "Cryptography", "Networking",
    "Embedded Systems", "Real-Time Systems", "Cluster Analysis", "Web Scraping",
    "Game Development", "AR", "NLP", "NER", "VLM", "Prompt Engineering", "Agile",
    "Aerospace", "Scientific Writing", "Requirements Engineering",
    "Software Engineering", "SDLC", "RAG", "Geospatial", "Taxonomy", "Education",
    "Data Visualization",
}


# ── GitHub helpers ─────────────────────────────────────────────────────────────
def parse_repo_slug(url: str) -> str | None:
    """Return 'owner/repo' from a GitHub URL, or None."""
    m = re.search(r"github\.com/([^/]+/[^/]+?)(?:\.git|/|$)", url, re.I)
    return m.group(1).rstrip("/") if m else None


def gh_get(path: str) -> dict | list | None:
    """GET from GitHub API with simple retry on rate-limit."""
    url = f"https://api.github.com/{path.lstrip('/')}"
    for attempt in range(3):
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            return r.json()
        if r.status_code == 404:
            return None
        if r.status_code in (403, 429):
            reset = int(r.headers.get("X-RateLimit-Reset", time.time() + 60))
            wait = max(reset - time.time(), 1)
            print(f"    Rate-limited, sleeping {wait:.0f}s…")
            time.sleep(wait)
        else:
            print(f"    GitHub {r.status_code} for {path}")
            return None
    return None


def get_file_content(slug: str, path: str) -> str | None:
    """Fetch a single file from the repo (decoded from base64)."""
    data = gh_get(f"repos/{slug}/contents/{path}")
    if not data or not isinstance(data, dict):
        return None
    encoded = data.get("content", "")
    try:
        return base64.b64decode(encoded).decode("utf-8", errors="replace")
    except Exception:
        return None


def collect_repo_data(slug: str) -> dict:
    """Collect all useful metadata for a repo."""
    result: dict = {"slug": slug, "error": None}

    # Basic repo info (description, topics, language)
    info = gh_get(f"repos/{slug}")
    if info is None:
        result["error"] = "repo not found or inaccessible"
        return result
    result["description"] = info.get("description") or ""
    result["primary_language"] = info.get("language") or ""
    result["topics"] = info.get("topics") or []
    result["stars"] = info.get("stargazers_count", 0)

    # Languages breakdown
    langs = gh_get(f"repos/{slug}/languages") or {}
    result["languages"] = langs

    # README (first 4 000 chars to keep tokens manageable)
    readme = get_file_content(slug, "README.md") or get_file_content(slug, "readme.md")
    result["readme"] = (readme or "")[:4000]

    # Dependency files
    result["requirements_txt"] = get_file_content(slug, "requirements.txt") or ""
    result["package_json_raw"] = get_file_content(slug, "package.json") or ""
    result["setup_py"] = get_file_content(slug, "setup.py") or ""
    result["pyproject_toml"] = get_file_content(slug, "pyproject.toml") or ""

    return result


# ── Claude analysis ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a technical analyst helping categorise software projects.
Given metadata about a GitHub repository, return a JSON object with exactly these keys:
{
  "domains": [],          // research/application domains from the controlled vocabulary
  "new_domains": [],      // domains you'd recommend adding that are NOT in the vocabulary
  "technologies": [],     // programming languages, frameworks, major libraries
  "notes": ""             // brief (1-2 sentence) justification
}

Controlled domain vocabulary (use exact strings from this list when possible):
Knowledge Graphs, Text Extraction, ML Provenance, Semantic Web, Machine Learning,
XAI, Computer Vision, Linked Data, Cybersecurity, SQA, Ontology, Description Logics,
FOL, HOL, LLMs, FAIR AI, Provenance, Knowledge Representation, Cryptography,
Networking, Embedded Systems, Real-Time Systems, Cluster Analysis, Web Scraping,
Game Development, AR, NLP, NER, VLM, Prompt Engineering, Agile, Aerospace,
Scientific Writing, Requirements Engineering, Software Engineering, SDLC, RAG,
Geospatial, Taxonomy, Education, Data Visualization

Return ONLY valid JSON. No markdown fences, no commentary outside the JSON."""


def analyse_repo(client: anthropic.Anthropic, repo_data: dict, existing: dict) -> dict:
    """Ask Claude to infer domains/technologies for a repo."""
    # Build a compact summary to send
    pkg_deps: list[str] = []
    if repo_data.get("package_json_raw"):
        try:
            pkg = json.loads(repo_data["package_json_raw"])
            pkg_deps = list({**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}.keys())
        except Exception:
            pass

    prompt = f"""Repository: {repo_data['slug']}
Description: {repo_data.get('description', '')}
Primary language: {repo_data.get('primary_language', '')}
All languages: {', '.join(repo_data.get('languages', {}).keys())}
GitHub topics: {', '.join(repo_data.get('topics', []))}

README (first 4000 chars):
{repo_data.get('readme', '')[:3000]}

requirements.txt:
{repo_data.get('requirements_txt', '')[:1000]}

setup.py / pyproject.toml snippet:
{(repo_data.get('setup_py') or repo_data.get('pyproject_toml') or '')[:500]}

package.json dependencies: {', '.join(pkg_deps[:40])}

Already present on this project in the YAML:
  domains: {existing.get('domains', [])}
  technologies: {existing.get('technologies', [])}
"""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        text = stream.get_final_message().content[0].text

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from text
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            return json.loads(m.group())
        return {"domains": [], "new_domains": [], "technologies": [], "notes": f"parse error: {text[:200]}"}


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    if not ANTHROPIC_API_KEY:
        print("ERROR: set ANTHROPIC_API_KEY environment variable")
        sys.exit(1)

    SCRAPES_DIR.mkdir(exist_ok=True)

    with open(YAML_PATH) as f:
        data = yaml.safe_load(f)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Collect all projects with a GitHub URL
    projects_to_scrape: list[dict] = []
    for proj in data.get("projects") or []:
        url = proj.get("repo_url") or proj.get("url") or ""
        if "github.com" in url:
            slug = parse_repo_slug(url)
            if slug:
                projects_to_scrape.append({"project": proj, "slug": slug})

    print(f"Found {len(projects_to_scrape)} GitHub projects\n")

    report_lines: list[str] = []

    for item in projects_to_scrape:
        proj = item["project"]
        slug = item["slug"]
        pid = proj.get("id", slug)
        print(f"── {pid}  ({slug})")

        # ── Step 1: collect raw GitHub data ────────────────────────────────
        raw_path = SCRAPES_DIR / f"{pid.replace('/', '_')}.json"
        if raw_path.exists():
            print("  [cache] using existing raw scrape")
            with open(raw_path) as f:
                repo_data = json.load(f)
        else:
            print("  [fetch] GitHub API…")
            repo_data = collect_repo_data(slug)
            with open(raw_path, "w") as f:
                json.dump(repo_data, f, indent=2)

        if repo_data.get("error"):
            print(f"  [skip] {repo_data['error']}")
            report_lines.append(f"\n## {pid}\n  SKIP: {repo_data['error']}")
            continue

        # ── Step 2: Claude analysis ─────────────────────────────────────────
        analysis_path = SCRAPES_DIR / f"{pid.replace('/', '_')}_analysis.json"
        if analysis_path.exists():
            print("  [cache] using existing analysis")
            with open(analysis_path) as f:
                analysis = json.load(f)
        else:
            print("  [claude] analysing…")
            existing = {
                "domains": proj.get("domains") or [],
                "technologies": proj.get("technologies") or [],
            }
            analysis = analyse_repo(client, repo_data, existing)
            with open(analysis_path, "w") as f:
                json.dump(analysis, f, indent=2)

        # ── Step 3: compute diff ────────────────────────────────────────────
        existing_domains = set(proj.get("domains") or [])
        existing_techs = set(proj.get("technologies") or [])

        new_domains = [d for d in analysis.get("domains", []) if d not in existing_domains]
        new_techs = [t for t in analysis.get("technologies", []) if t not in existing_techs]
        suggested_new = analysis.get("new_domains", [])

        lines = [f"\n## {pid}  ({slug})"]
        if new_domains:
            lines.append(f"  + domains:      {new_domains}")
        if new_techs:
            lines.append(f"  + technologies: {new_techs}")
        if suggested_new:
            lines.append(f"  ? new vocab:    {suggested_new}  (not in controlled list)")
        if not (new_domains or new_techs or suggested_new):
            lines.append("  (no additions suggested)")
        lines.append(f"  notes: {analysis.get('notes', '')}")
        report_lines.extend(lines)

        for ln in lines:
            print(ln)

    # ── Write report ────────────────────────────────────────────────────────
    report_text = "# GitHub Projects Scrape Report\n" + "\n".join(report_lines)
    report_path = SCRAPES_DIR / "report.txt"
    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\n✓ Report saved to {report_path}")
    print(f"  Raw scrapes + analyses in {SCRAPES_DIR}/")


if __name__ == "__main__":
    main()
