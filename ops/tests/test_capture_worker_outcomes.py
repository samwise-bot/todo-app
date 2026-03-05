import importlib.util
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / 'ops' / 'run' / 'capture_worker_outcomes.py'

spec = importlib.util.spec_from_file_location('capture_worker_outcomes', SCRIPT_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


class CaptureWorkerOutcomesTest(unittest.TestCase):
    def test_run_case_records_completed_status(self) -> None:
        row = module._run_case(1, 'python3 -c "print(123)"', timeout_seconds=2)
        self.assertEqual(row['taskId'], 1)
        self.assertEqual(row['status'], 'completed')
        self.assertFalse(row['timedOut'])

    def test_run_case_records_timeout_status(self) -> None:
        row = module._run_case(2, 'python3 -c "import time; time.sleep(3)"', timeout_seconds=1)
        self.assertEqual(row['status'], 'timed_out')
        self.assertTrue(row['timedOut'])


if __name__ == '__main__':
    unittest.main()
