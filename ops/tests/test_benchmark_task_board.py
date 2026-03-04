import unittest
from unittest import mock

from ops.run.benchmark_task_board import evaluate_sla, percentile, run


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

    def test_run_emits_meta_and_throughput(self) -> None:
        with mock.patch("ops.run.benchmark_task_board.hit", return_value=20.0):
            summary = run("http://127.0.0.1:8080", iterations=2, delay_ms=5.0)

        self.assertEqual(summary["/api/boards"]["count"], 2)
        self.assertEqual(summary["/api/boards"]["throughput_rps"], 50.0)
        self.assertEqual(summary["_meta"]["delay_ms"], 5.0)
        self.assertEqual(summary["_meta"]["total_requests"], 6)

    def test_run_supports_endpoint_subset(self) -> None:
        with mock.patch("ops.run.benchmark_task_board.hit", return_value=25.0):
            summary = run(
                "http://127.0.0.1:8080",
                iterations=3,
                endpoints=["/api/boards"],
            )

        self.assertIn("/api/boards", summary)
        self.assertNotIn("/api/columns", summary)
        self.assertEqual(summary["/api/boards"]["count"], 3)
        self.assertEqual(summary["_meta"]["total_requests"], 3)


if __name__ == "__main__":
    unittest.main()
