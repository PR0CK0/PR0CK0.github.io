import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from build import drop_cv_excluded


def test_drops_cv_excluded_entries_from_every_list_section():
    data = {
        "name": "X",
        "projects": [{"id": "keep"}, {"id": "hide", "cv_exclude": True}],
        "extracurriculars": [{"id": "hide", "cv_exclude": True}, {"id": "keep", "cv_exclude": False}],
        "work_experiences": [{"id": "keep"}],
        "hobbies": ["reading"],
    }
    result = drop_cv_excluded(data)
    assert [p["id"] for p in result["projects"]] == ["keep"]
    assert [e["id"] for e in result["extracurriculars"]] == ["keep"]
    assert [w["id"] for w in result["work_experiences"]] == ["keep"]
    assert result["hobbies"] == ["reading"]
    assert result["name"] == "X"
