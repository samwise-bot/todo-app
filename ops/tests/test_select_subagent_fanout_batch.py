import importlib.util
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "ops" / "run" / "select_subagent_fanout_batch.py"

spec = importlib.util.spec_from_file_location("select_subagent_fanout_batch", SCRIPT_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


class SelectSubagentFanoutBatchTest(unittest.TestCase):
    def test_build_worker_prompt_is_compact_and_task_specific(self) -> None:
        prompt = module._build_worker_prompt(22, "Auth: Add login/logout flow", "/repo")
        self.assertIn("task #22", prompt)
        self.assertIn("Auth: Add login/logout flow", prompt)
        self.assertIn("No code changes required.", prompt)
        self.assertLess(len(prompt), 320)


if __name__ == "__main__":
    unittest.main()
