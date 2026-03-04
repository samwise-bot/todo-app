import unittest

from ops.run.benchmark_task_board import evaluate_sla, percentile


class BenchmarkTaskBoardTest(unittest.TestCase):
    def test_percentile_empty(self) -> None:
        self.assertEqual(percentile([], 0.95), 0.0)

    def test_percentile_interpolates(self) -> None:
        samples = [10.0, 20.0, 30.0, 40.0]
        self.assertEqual(percentile(samples, 0.5), 25.0)
        self.assertAlmostEqual(percentile(samples, 0.95), 38.5)

    def test_evaluate_sla(self) -> None:
        summary = {
            "/api/tasks?page=1&pageSize=50": {"p95_ms": 120.0},
            "/api/boards": {"p95_ms": 240.0},
        }
        targets = {
            "/api/tasks?page=1&pageSize=50": 350.0,
            "/api/boards": 200.0,
        }

        report = evaluate_sla(summary, targets)

        self.assertFalse(report["allPassed"])
        self.assertTrue(report["endpoints"]["/api/tasks?page=1&pageSize=50"]["ok"])
        self.assertFalse(report["endpoints"]["/api/boards"]["ok"])


if __name__ == "__main__":
    unittest.main()
