import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
COLLECT = REPO_ROOT / "ops" / "run" / "collect-ci-telemetry.py"
CHECK = REPO_ROOT / "ops" / "run" / "check-ci-telemetry.py"


class CiTelemetryScriptsTest(unittest.TestCase):
    def test_collect_writes_json_and_csv(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            start_file = tmp_path / "start"
            output_json = tmp_path / "job.json"
            output_csv = tmp_path / "job.csv"

            start_file.write_text("1000\n", encoding="utf-8")

            result = subprocess.run(
                [
                    "python3",
                    str(COLLECT),
                    "--job-id",
                    "backend-test",
                    "--job-name",
                    "Backend Tests",
                    "--start-epoch-file",
                    str(start_file),
                    "--output-json",
                    str(output_json),
                    "--output-csv",
                    str(output_csv),
                    "--cache",
                    "setup_go=true",
                    "--cache",
                    "setup_node=false",
                    "--cache",
                    "other=",
                ],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, msg=result.stderr)
            self.assertTrue(output_json.exists())
            self.assertTrue(output_csv.exists())

            payload = json.loads(output_json.read_text(encoding="utf-8"))
            self.assertEqual(payload["job_id"], "backend-test")
            self.assertEqual(payload["cache_hits"]["setup_go"], "hit")
            self.assertEqual(payload["cache_hits"]["setup_node"], "miss")
            self.assertEqual(payload["cache_hits"]["other"], "unknown")
            self.assertGreaterEqual(payload["timing"]["duration_seconds"], 0)

    def test_check_passes_for_non_regressing_job(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            telemetry_dir = tmp_path / "telemetry"
            telemetry_dir.mkdir(parents=True)
            output_json = tmp_path / "summary.json"
            output_csv = tmp_path / "summary.csv"
            threshold_path = tmp_path / "thresholds.json"

            threshold_path.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "defaults": {
                            "max_duration_regression_percent": 30,
                            "max_duration_regression_seconds": 20,
                        },
                        "jobs": {
                            "backend-test": {
                                "baseline_duration_seconds": 100,
                                "max_cache_misses": 1,
                            }
                        },
                    }
                ),
                encoding="utf-8",
            )

            (telemetry_dir / "backend-test.json").write_text(
                json.dumps(
                    {
                        "job_id": "backend-test",
                        "timing": {"duration_seconds": 120},
                        "cache_hits": {"setup_go": "hit"},
                    }
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    "python3",
                    str(CHECK),
                    "--thresholds",
                    str(threshold_path),
                    "--telemetry-dir",
                    str(telemetry_dir),
                    "--output-json",
                    str(output_json),
                    "--output-csv",
                    str(output_csv),
                ],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
            summary = json.loads(output_json.read_text(encoding="utf-8"))
            self.assertEqual(summary["result"], "pass")

    def test_check_uses_history_regression_threshold(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            telemetry_dir = tmp_path / "telemetry"
            telemetry_dir.mkdir(parents=True)
            output_json = tmp_path / "summary.json"
            output_csv = tmp_path / "summary.csv"
            threshold_path = tmp_path / "thresholds.json"
            history_csv = tmp_path / "history.csv"

            threshold_path.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "defaults": {
                            "max_duration_regression_percent": 200,
                            "max_duration_regression_seconds": 200,
                        },
                        "jobs": {
                            "backend-test": {
                                "baseline_duration_seconds": 100,
                                "max_history_regression_percent": 10,
                            }
                        },
                    }
                ),
                encoding="utf-8",
            )

            history_csv.write_text(
                "job_id,duration_seconds\nbackend-test,100\nbackend-test,105\n",
                encoding="utf-8",
            )

            (telemetry_dir / "backend-test.json").write_text(
                json.dumps(
                    {
                        "job_id": "backend-test",
                        "timing": {"duration_seconds": 130},
                        "cache_hits": {"setup_go": "hit"},
                    }
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    "python3",
                    str(CHECK),
                    "--thresholds",
                    str(threshold_path),
                    "--telemetry-dir",
                    str(telemetry_dir),
                    "--output-json",
                    str(output_json),
                    "--output-csv",
                    str(output_csv),
                    "--history-csv",
                    str(history_csv),
                ],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            summary = json.loads(output_json.read_text(encoding="utf-8"))
            self.assertEqual(summary["result"], "fail")
            reasons = "\n".join(summary["failures"])
            self.assertIn("historical duration regression", reasons)

    def test_check_fails_for_duration_regression(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            telemetry_dir = tmp_path / "telemetry"
            telemetry_dir.mkdir(parents=True)
            output_json = tmp_path / "summary.json"
            output_csv = tmp_path / "summary.csv"
            threshold_path = tmp_path / "thresholds.json"

            threshold_path.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "defaults": {
                            "max_duration_regression_percent": 20,
                            "max_duration_regression_seconds": 10,
                        },
                        "jobs": {
                            "backend-test": {
                                "baseline_duration_seconds": 100,
                                "max_cache_misses": 0,
                            }
                        },
                    }
                ),
                encoding="utf-8",
            )

            (telemetry_dir / "backend-test.json").write_text(
                json.dumps(
                    {
                        "job_id": "backend-test",
                        "timing": {"duration_seconds": 160},
                        "cache_hits": {"setup_go": "miss"},
                    }
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    "python3",
                    str(CHECK),
                    "--thresholds",
                    str(threshold_path),
                    "--telemetry-dir",
                    str(telemetry_dir),
                    "--output-json",
                    str(output_json),
                    "--output-csv",
                    str(output_csv),
                ],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            summary = json.loads(output_json.read_text(encoding="utf-8"))
            self.assertEqual(summary["result"], "fail")
            reasons = "\n".join(summary["failures"])
            self.assertIn("duration", reasons)
            self.assertIn("cache misses", reasons)


if __name__ == "__main__":
    unittest.main()
