"""The manual enrichment command shares the canonical competency catalog."""
import importlib.util
import json
from pathlib import Path

import pytest

SCRIPT = Path(__file__).parents[1] / 'scripts' / 'enrich_projects.py'
SPEC = importlib.util.spec_from_file_location('enrich_projects', SCRIPT)
enrich = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(enrich)


def test_known_names_come_from_validated_catalog(tmp_path):
    path = tmp_path / 'competencies.json'
    catalog = {
        'categories': {'prog_languages': 'Languages'},
        'terms': [{'id': 'python', 'label': 'Python', 'category': 'prog_languages', 'aliases': ['Python 3']}],
    }
    path.write_text(json.dumps(catalog))
    assert enrich.load_known_techs(path) == {'Python', 'Python 3'}
    catalog['terms'].append({'id': 'other', 'label': 'python', 'category': 'prog_languages', 'aliases': []})
    path.write_text(json.dumps(catalog))
    with pytest.raises(ValueError, match='Ambiguous'):
        enrich.load_known_techs(path)


def test_main_uses_only_canonical_portfolio_file(tmp_path, monkeypatch, capsys):
    data_path = tmp_path / 'portfolio.yaml'
    data_path.write_text('projects: []\n')
    catalog_path = tmp_path / 'competencies.json'
    catalog_path.write_text(json.dumps({'categories': {}, 'terms': []}))
    monkeypatch.setattr(enrich, 'YAML_PATH', data_path)
    monkeypatch.setattr(enrich, 'CATALOG_PATH', catalog_path, raising=False)
    monkeypatch.chdir(tmp_path)
    enrich.main()
    assert sorted(p.name for p in tmp_path.iterdir()) == ['competencies.json', 'portfolio.yaml']
    assert 'competencies.json' in capsys.readouterr().out
