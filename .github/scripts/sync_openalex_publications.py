"""
Syncs new publications from OpenAlex into public/data/tyler-procko.yaml.

Queries the OpenAlex API for all works associated with the configured ORCID.
For each result, checks whether the DOI already exists in the YAML (via doi
or url field). If not found, appends a stub entry tagged source: openalex and
featured: false for manual review and enrichment.

Usage:
    python3 .github/scripts/sync_openalex_publications.py

Exit codes:
    0 — completed (with or without changes)
    1 — fatal error
"""

from __future__ import annotations

import re
import sys
import time
import json
import urllib.request
import urllib.error

try:
    from ruamel.yaml import YAML
except ImportError:
    print("ERROR: ruamel.yaml is required. Install with: pip install ruamel.yaml")
    sys.exit(1)

YAML_PATH = "public/data/tyler-procko.yaml"
ORCID     = "0000-0002-7801-0124"
MAILTO    = "prockot@my.erau.edu"
PER_PAGE  = 50


def openalex_url(page: int = 1) -> str:
    return (
        f"https://api.openalex.org/works"
        f"?filter=author.orcid:{ORCID}"
        f"&per-page={PER_PAGE}"
        f"&page={page}"
        f"&mailto={MAILTO}"
    )


def fetch_openalex() -> list[dict]:
    """Fetch all works for the ORCID from OpenAlex, handling pagination."""
    results: list[dict] = []
    page = 1
    while True:
        url = openalex_url(page)
        req = urllib.request.Request(url, headers={"User-Agent": f"procko.pro-sync/1.0 mailto:{MAILTO}"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            print(f"  Error fetching OpenAlex page {page}: {e}")
            break

        batch = data.get("results", [])
        results.extend(batch)

        meta = data.get("meta", {})
        total = meta.get("count", 0)
        if len(results) >= total or len(batch) < PER_PAGE:
            break
        page += 1
        time.sleep(0.3)

    return results


def normalize_doi(doi: str | None) -> str | None:
    """Normalize any DOI representation to 'https://doi.org/...' form."""
    if not doi:
        return None
    doi = doi.strip()
    if doi.startswith("10."):
        return f"https://doi.org/{doi}"
    if "doi.org/" in doi:
        return "https://doi.org/" + doi.split("doi.org/", 1)[1]
    return doi


def slug_from_title(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug[:60].rstrip("-")


def reconstruct_abstract(inverted: dict | None) -> str | None:
    if not inverted:
        return None
    try:
        size = max(pos for positions in inverted.values() for pos in positions) + 1
        words: list[str] = [""] * size
        for word, positions in inverted.items():
            for pos in positions:
                words[pos] = word
        return " ".join(w for w in words if w)
    except Exception:
        return None


def main() -> None:
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 120

    with open(YAML_PATH, encoding="utf-8") as f:
        data = yaml.load(f)

    pubs = data.get("publications") or []

    # Collect all known DOIs from existing entries
    known: set[str] = set()
    for pub in pubs:
        doi = normalize_doi(pub.get("doi"))
        if doi:
            known.add(doi)
        url = pub.get("url") or ""
        if "doi.org" in url:
            norm = normalize_doi(url)
            if norm:
                known.add(norm)

    print(f"Known publications: {len(pubs)} entries, {len(known)} with DOIs")

    works = fetch_openalex()
    print(f"OpenAlex returned:  {len(works)} works")

    added = 0
    for work in works:
        doi = normalize_doi(work.get("doi"))
        if not doi:
            continue  # skip works without a DOI

        if doi in known:
            print(f"  ✓ {doi}")
            continue

        title = (work.get("title") or "Untitled").strip()

        raw_date = work.get("publication_date") or str(work.get("publication_year") or "")
        date = raw_date[:7] if len(raw_date) > 4 else raw_date  # prefer YYYY-MM over YYYY

        source_info = (work.get("primary_location") or {}).get("source") or {}
        venue = source_info.get("display_name") or ""

        authors = [
            a["author"]["display_name"]
            for a in (work.get("authorships") or [])
            if (a.get("author") or {}).get("display_name")
        ]

        abstract = reconstruct_abstract(work.get("abstract_inverted_index"))

        pub_id = f"pub/{slug_from_title(title)}"

        stub: dict = {
            "id": pub_id,
            "title": title,
            "authors": authors,
            "venue": venue,
            "date": date,
            "status": "published",
            "url": doi,
            "doi": doi,
            "author_role": "",
            "source": "openalex",
            "featured": False,
        }
        if abstract:
            stub["abstract"] = abstract

        pubs.append(stub)
        known.add(doi)
        added += 1
        print(f"  + ADDED: {title[:80]}")

    if added:
        data["publications"] = pubs
        with open(YAML_PATH, "w", encoding="utf-8") as f:
            yaml.dump(data, f)
        print(f"\n✓ {added} publication(s) added to {YAML_PATH}")
    else:
        print("\nNo new publications found.")


if __name__ == "__main__":
    main()
