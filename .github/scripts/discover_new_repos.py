"""
Auto-discovers new public GitHub repos and adds skeleton project entries to
public/data/tyler-procko.yaml.

Queries the GitHub API for all public, non-forked repos owned by GITHUB_USER.
Any repo whose html_url isn't already tracked as a project repo_url gets a
minimal skeleton entry appended to the projects list. Repos without a GitHub
"About" description are skipped — they're usually incomplete or throwaway.

After adding skeletons, the script immediately syncs descriptions for the new
entries so they're populated on the first run.

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
    """Return all public, non-forked repos for GITHUB_USER (paginated)."""
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


def repo_slug(name: str) -> str:
    return re.sub(r"[_\s]+", "-", name).lower()


def repo_title(name: str) -> str:
    return re.sub(r"[-_]+", " ", name).strip()


def normalize_url(url: str) -> str:
    return (url or "").strip().rstrip("/").lower()


def make_skeleton(repo: dict) -> CommentedMap:
    entry = CommentedMap()
    entry["id"] = f"proj/{repo_slug(repo['name'])}"
    entry["title"] = repo_title(repo["name"])
    date_str = repo.get("pushed_at") or repo.get("created_at") or ""
    entry["year"] = date_str[:7] if date_str else ""
    entry["repo_url"] = repo["html_url"]
    if repo.get("description"):
        entry["description"] = repo["description"]
    return entry


def main() -> None:
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 120

    with open(YAML_PATH, encoding="utf-8") as f:
        data = yaml.load(f)

    projects = data.get("projects") or []

    # Build set of all already-tracked repo URLs (from projects)
    existing_urls = {
        normalize_url(p.get("repo_url", ""))
        for p in projects
        if p.get("repo_url")
    }

    print(f"Fetching public repos for {GITHUB_USER} ...")
    gh_repos = fetch_all_repos()
    print(f"Found {len(gh_repos)} public non-fork repos on GitHub")

    added = 0
    for repo in gh_repos:
        url = normalize_url(repo["html_url"])
        if url in existing_urls:
            continue

        # Skip repos with no description — likely incomplete or throwaway
        if not (repo.get("description") or "").strip():
            print(f"  SKIP (no description): {repo['name']}")
            continue

        skeleton = make_skeleton(repo)
        print(f"  NEW: {skeleton['id']} — {repo['html_url']}")
        print(f"       {repo.get('description', '')[:80]}")
        projects.append(skeleton)
        existing_urls.add(url)
        added += 1
        time.sleep(0.1)

    if added:
        with open(YAML_PATH, "w", encoding="utf-8") as f:
            yaml.dump(data, f)
        print(f"\n✓ {added} new project(s) added to {YAML_PATH}")
        print("  Review new entries and set cv_exclude: true on any you don't want displayed.")
    else:
        print("\nNo new repos found.")


if __name__ == "__main__":
    main()
