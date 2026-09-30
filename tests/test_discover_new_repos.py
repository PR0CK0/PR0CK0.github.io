import importlib.util
from pathlib import Path

import pytest


SCRIPT_PATH = Path(__file__).parents[1] / ".github" / "scripts" / "discover_new_repos.py"
SPEC = importlib.util.spec_from_file_location("discover_new_repos", SCRIPT_PATH)
discover = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(discover)
VALIDATOR_PATH = Path(__file__).parents[1] / ".github" / "scripts" / "validate_yaml_terms.py"
VALIDATOR_SPEC = importlib.util.spec_from_file_location("validate_yaml_terms", VALIDATOR_PATH)
validator = importlib.util.module_from_spec(VALIDATOR_SPEC)
VALIDATOR_SPEC.loader.exec_module(validator)


def test_christian_project_topics_map_to_known_skills_and_domains(monkeypatch):
    monkeypatch.setattr(discover, "gh_get", lambda _path: {})
    monkeypatch.setattr(discover.time, "sleep", lambda _seconds: None)
    topics = ["wikidata", "sparql", "owl", "rdf", "rdfs", "anthropology"]

    technologies = discover.infer_technologies("owner", "repo", topics)
    domains = discover.infer_domains(topics)
    known_terms = validator.load_tech_category_keys()

    assert technologies == ["Wikidata", "SPARQL", "OWL", "RDF", "RDFS"]
    assert domains == ["Anthropology"]
    assert set(technologies + domains) <= known_terms


def test_open_discovery_pr_is_detected(monkeypatch):
    repository = "PR0CK0/PR0CK0.github.io"
    monkeypatch.setattr(
        discover,
        "gh_get",
        lambda _path: [
            {
                "head": {
                    "ref": "auto/discover-repos-20260930-133017",
                    "repo": {"full_name": repository},
                }
            }
        ],
    )

    assert discover.has_open_discovery_pr(repository)


def test_regular_open_pr_does_not_block_repo_discovery(monkeypatch):
    monkeypatch.setattr(
        discover,
        "gh_get",
        lambda _path: [{"head": {"ref": "feature/something", "repo": {"full_name": "owner/repo"}}}],
    )

    assert not discover.has_open_discovery_pr("owner/repo")


def test_failed_open_pr_lookup_fails_closed(monkeypatch):
    monkeypatch.setattr(discover, "gh_get", lambda _path: None)

    with pytest.raises(RuntimeError, match="could not verify open discovery PRs"):
        discover.has_open_discovery_pr("owner/repo")
