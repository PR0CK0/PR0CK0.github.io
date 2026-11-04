"""Contract tests and standalone entry point for the canonical skill validator."""

import importlib.util
import json
from pathlib import Path

import pytest

SCRIPT = Path(__file__).parents[1] / '.github' / 'scripts' / 'validate_yaml_terms.py'
SPEC = importlib.util.spec_from_file_location('validate_yaml_terms', SCRIPT)
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


@pytest.fixture
def catalog(tmp_path):
    data = {
        'categories': {'dev_tools': 'Tools', 'domains': 'Domains', 'soft_skills': 'Soft skills'},
        'terms': [
            {'id': 'tool-python', 'label': 'Python', 'category': 'dev_tools', 'aliases': ['Python 3']},
            {'id': 'domain-ontology', 'label': 'Ontology', 'category': 'domains', 'aliases': []},
            {'id': 'writing', 'label': 'Technical Writing', 'category': 'soft_skills', 'aliases': []},
        ],
    }
    path = tmp_path / 'competencies.json'
    path.write_text(json.dumps(data))
    return path, data


def test_catalog_names_include_aliases(catalog, monkeypatch):
    path, _ = catalog
    monkeypatch.setattr(validator, 'CATALOG_PATH', path, raising=False)
    assert validator.load_tech_category_keys() == {'Python', 'Python 3', 'Ontology', 'Technical Writing'}
    terms = validator.load_catalog(path)
    assert terms['python']['id'] == terms['python 3']['id']


@pytest.mark.parametrize('change', ['duplicate_id', 'duplicate_label', 'alias_collision', 'unknown_category', 'case_collision', 'id_name_collision'])
def test_invalid_catalog_is_rejected(catalog, change):
    path, data = catalog
    terms = data['terms']
    if change == 'duplicate_id':
        terms[1]['id'] = terms[0]['id']
    elif change == 'duplicate_label':
        terms[1]['label'] = terms[0]['label']
    elif change == 'alias_collision':
        terms[1]['aliases'] = ['Python 3']
    elif change == 'case_collision':
        terms[1]['aliases'] = [' python ']
    elif change == 'id_name_collision':
        terms[1]['label'] = 'tool-python'
    else:
        terms[1]['category'] = 'unknown'
    path.write_text(json.dumps(data))
    with pytest.raises(ValueError):
        validator.load_catalog(path)



def test_alias_cannot_repeat_its_own_label_or_id(catalog):
    path, data = catalog
    data['terms'][0].update(id='python', aliases=['Python'])
    path.write_text(json.dumps(data))
    with pytest.raises(ValueError):
        validator.load_catalog(path)


def test_aliases_array_is_required(catalog):
    path, data = catalog
    del data['terms'][0]['aliases']
    path.write_text(json.dumps(data))
    with pytest.raises(ValueError, match='aliases'):
        validator.load_catalog(path)


@pytest.mark.parametrize('term_id', ['Python', ' python', 'python ', 'python_3', 'python--3', '-python', 'python-'])
def test_stable_ids_require_lowercase_hyphenated_format(catalog, term_id):
    path, data = catalog
    data['terms'][0]['id'] = term_id
    path.write_text(json.dumps(data))
    with pytest.raises(ValueError, match='ID'):
        validator.load_catalog(path)


def test_valid_technical_writing_and_aliases(catalog):
    path, _ = catalog
    data = {'projects': [{'id': 'project', 'technologies': [' python 3 '], 'soft_skills': ['writing']}]}
    assert validator.validate_terms(data, validator.load_catalog(path)) == ([], [])


def test_unicode_lookup_matches_javascript_lowercase(catalog):
    path, data = catalog
    data['terms'][0]['label'] = 'Straße'
    path.write_text(json.dumps(data))
    lookup = validator.load_catalog(path)
    assert 'straße' in lookup and 'strasse' not in lookup
    errors, _ = validator.validate_terms(
        {'projects': [{'id': 'project', 'technologies': ['  STRAßE ', 'STRASSE']}]}, lookup,
    )
    assert len(errors) == 1 and 'STRASSE' in errors[0]


def test_unknown_names_fail_but_placement_is_review_only(catalog):
    path, _ = catalog
    data = {'projects': [{'id': 'project', 'domains': ['Python'], 'technologies': ['Missing']}]}
    errors, review = validator.validate_terms(data, validator.load_catalog(path))
    assert len(errors) == 1 and 'Missing' in errors[0]
    assert len(review) == 1 and 'Python' in review[0] and 'dev_tools' in review[0]


def test_alias_and_label_cannot_double_count_one_term(catalog):
    path, _ = catalog
    data = {'projects': [{'id': 'project', 'technologies': ['Python', 'Python 3']}]}
    errors, _ = validator.validate_terms(data, validator.load_catalog(path))
    assert len(errors) == 1 and 'duplicate' in errors[0]


def test_usage_field_must_be_a_list(catalog):
    path, _ = catalog
    errors, _ = validator.validate_terms({'education': [{'id': 'edu', 'technologies': 'Python'}]}, validator.load_catalog(path))
    assert len(errors) == 1 and 'list' in errors[0]


def test_main_reports_review_without_failure(catalog, monkeypatch, capsys):
    path, _ = catalog
    monkeypatch.setattr(validator, 'CATALOG_PATH', path, raising=False)
    monkeypatch.setattr(validator, 'load_yaml', lambda: {'projects': [{'id': 'project', 'domains': ['Python']}]})
    assert validator.main() == 0
    assert 'review' in capsys.readouterr().out.lower()


def test_main_fails_for_unknown_terms(catalog, monkeypatch):
    path, _ = catalog
    monkeypatch.setattr(validator, 'CATALOG_PATH', path, raising=False)
    monkeypatch.setattr(validator, 'load_yaml', lambda: {'projects': [{'id': 'project', 'domains': ['Missing']}]})
    assert validator.main() == 1


if __name__ == '__main__':
    raise SystemExit(validator.main())
