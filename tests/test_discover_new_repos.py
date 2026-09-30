import importlib.util
from pathlib import Path


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
