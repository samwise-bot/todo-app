import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "ops" / "run" / "validate_subagent_fanout_sweep.py"

spec = importlib.util.spec_from_file_location("validate_subagent_fanout_sweep", SCRIPT_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


class ValidateSubagentFanoutSweepTest(unittest.TestCase):
    def test_next_ids_from_tasks_json_filters_next_only(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "tasks.json"
            path.write_text(json.dumps({"items": [
                {"id": 1, "state": "next"},
                {"id": 2, "state": "done"},
                {"id": 3, "state": "next"},
            ]}))
            self.assertEqual(module._next_ids_from_tasks_json(path), [1, 3])

    def test_next_ids_from_tasks_json_accepts_data_envelope_and_deduplicates(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "tasks.json"
            path.write_text(json.dumps({"data": [
                {"id": 4, "state": "next"},
                {"id": "4", "state": "next"},
                {"id": 5, "state": "inbox"},
                {"state": "next"},
                "noise",
            ]}))
            self.assertEqual(module._next_ids_from_tasks_json(path), [4])

    def test_worker_outcome_summary_counts_completion_and_timeouts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "worker-results.json"
            path.write_text(json.dumps({"items": [
                {"taskId": 1, "status": "completed"},
                {"taskId": 2, "status": "timeout"},
                {"taskId": 3, "status": "done"},
                {"taskId": 4, "status": "timed_out"},
            ]}))
            summary = module._worker_outcome_summary(path)
            self.assertTrue(summary["found"])
            self.assertEqual(summary["total"], 4)
            self.assertEqual(summary["completed"], 2)
            self.assertEqual(summary["timedOut"], 2)


if __name__ == "__main__":
    unittest.main()
