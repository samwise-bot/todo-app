import importlib.util
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "ops" / "run" / "plan_subagent_fanout.py"

spec = importlib.util.spec_from_file_location("plan_subagent_fanout", SCRIPT_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
import sys
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class SubagentFanoutPlannerTest(unittest.TestCase):
    def test_select_next_batch_orders_priority_due_and_id(self) -> None:
        items = [
            {"id": 4, "title": "d", "state": "next", "priority": 2},
            {"id": 3, "title": "c", "state": "next", "priority": 1, "dueAt": "2026-03-10T00:00:00Z"},
            {"id": 2, "title": "b", "state": "next", "priority": 1, "dueAt": "2026-03-09T00:00:00Z"},
            {"id": 1, "title": "a", "state": "next", "priority": 1},
        ]

        batch, next_cursor = module.select_next_batch(items, start_cursor=0, batch_size=3)

        self.assertEqual([t.id for t in batch], [2, 3, 1])
        self.assertEqual(next_cursor, 3)

    def test_select_next_batch_wraps_cursor_when_end_reached(self) -> None:
        items = [
            {"id": 1, "title": "a", "state": "next", "priority": 1},
            {"id": 2, "title": "b", "state": "next", "priority": 1},
        ]

        batch, next_cursor = module.select_next_batch(items, start_cursor=1, batch_size=5)

        self.assertEqual([t.id for t in batch], [2])
        self.assertEqual(next_cursor, 0)

    def test_cursor_persistence_roundtrip(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "cursor.json"

            self.assertEqual(module.load_cursor(p), 0)
            module.save_cursor(p, 4)
            self.assertEqual(module.load_cursor(p), 4)


if __name__ == "__main__":
    unittest.main()
