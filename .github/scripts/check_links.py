"""
Extracts all URLs from tyler-procko.yaml and checks each one with an HTTP HEAD
request. Exits with code 1 and prints a report if any links are broken, so the
GitHub Actions workflow can decide whether to send an alert email.
"""

import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

YAML_PATH = Path(__file__).resolve().parents[2] / "public/data/tyler-procko.yaml"

# Fields that contain URLs
URL_FIELDS = re.compile(
    r'^\s+(?:url|repo_url|org_url|doi|thesis_url|advisor_url|website)\s*:\s*(.+)$'
)

TIMEOUT = 10  # seconds per request
RETRY_CODES = {429, 503}  # retry once on rate-limit / temporary unavailable
SKIP_PREFIXES = ("mailto:",)

def extract_urls(path: Path) -> list[tuple[str, str]]:
    """Return list of (url, context_line) pairs from the YAML."""
    results = []
    text = path.read_text(encoding="utf-8")
    for line in text.splitlines():
        m = URL_FIELDS.match(line)
        if not m:
            continue
        raw = m.group(1).strip().strip("'\"")
        if not raw or any(raw.startswith(p) for p in SKIP_PREFIXES):
            continue
        # doi fields are sometimes bare DOI strings, not full URLs
        if raw.startswith("10."):
            raw = f"https://doi.org/{raw}"
        if raw.startswith("http"):
            results.append((raw, line.strip()))
    return results


def check_url(url: str) -> tuple[int | None, str]:
    """Return (status_code, error_message). status_code None means request failed."""
    headers = {"User-Agent": "Mozilla/5.0 (link-checker; procko.pro)"}
    req = urllib.request.Request(url, headers=headers, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, ""
    except urllib.error.HTTPError as e:
        if e.code in RETRY_CODES:
            time.sleep(3)
            try:
                with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                    return resp.status, ""
            except Exception as e2:
                return None, str(e2)
        return e.code, str(e)
    except Exception as e:
        return None, str(e)


def main() -> int:
    urls = extract_urls(YAML_PATH)
    print(f"Checking {len(urls)} URLs from {YAML_PATH.name}...")

    broken: list[tuple[str, str, int | None, str]] = []

    for url, context in urls:
        status, err = check_url(url)
        symbol = "✓" if status and 200 <= status < 400 else "✗"
        print(f"  {symbol}  [{status or 'ERR'}]  {url}")
        if not status or status >= 400:
            broken.append((url, context, status, err))

    if broken:
        print(f"\n{'─'*60}")
        print(f"❌  {len(broken)} broken link(s) found:\n")
        for url, ctx, status, err in broken:
            print(f"  URL    : {url}")
            print(f"  Status : {status or 'connection error'}")
            if err:
                print(f"  Error  : {err}")
            print(f"  Source : {ctx}")
            print()
        # Write report to file for the email action to read
        report_path = Path("/tmp/broken_links.txt")
        with report_path.open("w") as f:
            f.write(f"{len(broken)} broken link(s) found in tyler-procko.yaml\n\n")
            for url, ctx, status, err in broken:
                f.write(f"URL    : {url}\n")
                f.write(f"Status : {status or 'connection error'}\n")
                if err:
                    f.write(f"Error  : {err}\n")
                f.write(f"Source : {ctx}\n\n")
        return 1

    print(f"\n✅  All {len(urls)} links OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
