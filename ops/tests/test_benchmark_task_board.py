import unittest

from ops.run.benchmark_task_board import percentile


class BenchmarkTaskBoardTest(unittest.TestCase):
    def test_percentile_empty(self) -> None:
        self.assertEqual(percentile([], 0.95), 0.0)

    def test_percentile_interpolates(self) -> None:
        samples = [10.0, 20.0, 30.0, 40.0]
        self.assertEqual(percentile(samples, 0.5), 25.0)
        self.assertAlmostEqual(percentile(samples, 0.95), 38.5)


if __name__ == "__main__":
    unittest.main()
