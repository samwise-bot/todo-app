import os
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "ops" / "run" / "test-backend.sh"


class BackendRunnerFallbackTest(unittest.TestCase):
    def _write_fake_gh(self, bin_dir: Path) -> None:
        gh_path = bin_dir / "gh"
        gh_path.write_text(
            """#!/usr/bin/env bash
set -euo pipefail
cmd="${1:-}"
if [[ -n "${FAKE_GH_LOG:-}" ]]; then
  echo "$*" >>"$FAKE_GH_LOG"
fi

case "$cmd" in
  auth)
    if [[ "${2:-}" == "status" ]]; then
      if [[ "${GH_AUTH_STATUS_EXIT:-0}" == "0" ]]; then
        exit 0
      fi
      exit 1
    fi
    ;;
  workflow)
    if [[ "${2:-}" == "run" ]]; then
      exit 0
    fi
    ;;
  run)
    sub="${2:-}"
    if [[ "$sub" == "list" ]]; then
      idx_file="${GH_RUN_LIST_INDEX_FILE:?missing GH_RUN_LIST_INDEX_FILE}"
      idx=0
      if [[ -f "$idx_file" ]]; then
        idx="$(cat "$idx_file")"
      fi
      IFS='|' read -r -a seq <<<"${GH_RUN_LIST_SEQUENCE:-null}"
      out="null"
      if (( idx < ${#seq[@]} )); then
        out="${seq[$idx]}"
      elif (( ${#seq[@]} > 0 )); then
        out="${seq[${#seq[@]}-1]}"
      fi
      echo "$((idx + 1))" >"$idx_file"
      echo "$out"
      exit 0
    fi
    if [[ "$sub" == "view" ]]; then
      idx_file="${GH_RUN_VIEW_INDEX_FILE:?missing GH_RUN_VIEW_INDEX_FILE}"
      idx=0
      if [[ -f "$idx_file" ]]; then
        idx="$(cat "$idx_file")"
      fi
      IFS='|' read -r -a seq <<<"${GH_RUN_VIEW_SEQUENCE:-completed,success,}"
      item="completed,success,"
      if (( idx < ${#seq[@]} )); then
        item="${seq[$idx]}"
      elif (( ${#seq[@]} > 0 )); then
        item="${seq[${#seq[@]}-1]}"
      fi
      echo "$((idx + 1))" >"$idx_file"

      IFS=',' read -r status conclusion url <<<"$item"
      json_field=""
      while [[ $# -gt 0 ]]; do
        if [[ "$1" == "--json" ]]; then
          shift
          json_field="${1:-}"
          break
        fi
        shift
      done
      case "$json_field" in
        status) echo "$status" ;;
        conclusion) echo "$conclusion" ;;
        url) echo "$url" ;;
        *)
          echo "unsupported --json field: $json_field" >&2
          exit 1
          ;;
      esac
      exit 0
    fi
    ;;
esac

echo "unsupported gh args: $*" >&2
exit 1
""",
            encoding="utf-8",
        )
        gh_path.chmod(0o755)

    def _write_fake_sleep(self, bin_dir: Path) -> None:
        sleep_path = bin_dir / "fake-sleep"
        sleep_path.write_text(
            """#!/usr/bin/env bash
set -euo pipefail
if [[ -n "${FAKE_SLEEP_LOG:-}" ]]; then
  echo "${1:-}" >>"$FAKE_SLEEP_LOG"
fi
exit 0
""",
            encoding="utf-8",
        )
        sleep_path.chmod(0o755)

    def _write_fake_go(self, bin_dir: Path) -> None:
        go_path = bin_dir / "go"
        go_path.write_text(
            """#!/usr/bin/env bash
set -euo pipefail
if [[ -n "${FAKE_GO_LOG:-}" ]]; then
  echo "$*" >>"$FAKE_GO_LOG"
fi
exit 0
""",
            encoding="utf-8",
        )
        go_path.chmod(0o755)

    def _run_script(self, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["bash", str(SCRIPT)],
            cwd=REPO_ROOT,
            env=env,
            check=False,
            text=True,
            capture_output=True,
        )

    def test_remote_fallback_resolves_run_id_after_long_queue_delay(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            bin_dir = tmp_path / "bin"
            bin_dir.mkdir()
            self._write_fake_gh(bin_dir)
            self._write_fake_sleep(bin_dir)

            gh_log = tmp_path / "gh.log"
            sleep_log = tmp_path / "sleep.log"
            env = os.environ.copy()
            env.update(
                {
                    "PATH": f"{bin_dir}:{env.get('PATH', '')}",
                    "BACKEND_TEST_FORCE_REMOTE": "1",
                    "BACKEND_TEST_REMOTE_REF": "main",
                    "BACKEND_TEST_SLEEP_BIN": str(bin_dir / "fake-sleep"),
                    "FAKE_GH_LOG": str(gh_log),
                    "FAKE_SLEEP_LOG": str(sleep_log),
                    "GH_AUTH_STATUS_EXIT": "0",
                    "GH_RUN_LIST_INDEX_FILE": str(tmp_path / "run_list.idx"),
                    "GH_RUN_VIEW_INDEX_FILE": str(tmp_path / "run_view.idx"),
                    "GH_RUN_LIST_SEQUENCE": "null|null|null|null|null|null|null|null|987654321",
                    "GH_RUN_VIEW_SEQUENCE": "completed,success,https://example.invalid/run/987654321",
                }
            )

            result = self._run_script(env)

            self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
            self.assertIn("resolved remote backend test run id: 987654321", result.stdout)
            self.assertIn("completed with conclusion 'success'", result.stdout)

            gh_lines = gh_log.read_text(encoding="utf-8").splitlines()
            run_list_calls = [line for line in gh_lines if line.startswith("run list")]
            self.assertEqual(len(run_list_calls), 9)

            sleep_values = sleep_log.read_text(encoding="utf-8").splitlines()
            self.assertIn("55", sleep_values)

    def test_remote_fallback_returns_failure_for_non_success_terminal_conclusion(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            bin_dir = tmp_path / "bin"
            bin_dir.mkdir()
            self._write_fake_gh(bin_dir)
            self._write_fake_sleep(bin_dir)

            env = os.environ.copy()
            env.update(
                {
                    "PATH": f"{bin_dir}:{env.get('PATH', '')}",
                    "BACKEND_TEST_FORCE_REMOTE": "1",
                    "BACKEND_TEST_REMOTE_REF": "main",
                    "BACKEND_TEST_SLEEP_BIN": str(bin_dir / "fake-sleep"),
                    "GH_AUTH_STATUS_EXIT": "0",
                    "GH_RUN_LIST_INDEX_FILE": str(tmp_path / "run_list.idx"),
                    "GH_RUN_VIEW_INDEX_FILE": str(tmp_path / "run_view.idx"),
                    "GH_RUN_LIST_SEQUENCE": "111",
                    "GH_RUN_VIEW_SEQUENCE": "in_progress,,https://example.invalid/run/111|completed,failure,https://example.invalid/run/111",
                }
            )

            result = self._run_script(env)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("resolved remote backend test run id: 111", result.stdout)
            self.assertIn("completed with conclusion 'failure'", result.stdout)

    def test_bootstraps_nix_go_path_before_local_detection(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            nix_go_bin = tmp_path / "nix-profile" / "bin"
            nix_go_bin.mkdir(parents=True)
            self._write_fake_go(nix_go_bin)

            go_log = tmp_path / "go.log"
            env = os.environ.copy()
            env.update(
                {
                    "PATH": f"/usr/bin:/bin:{env.get('PATH', '')}",
                    "BACKEND_TEST_FORCE_REMOTE": "0",
                    "BACKEND_TEST_NIX_GO_BIN_CANDIDATES": str(nix_go_bin),
                    "FAKE_GO_LOG": str(go_log),
                }
            )

            result = self._run_script(env)

            self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
            go_calls = go_log.read_text(encoding="utf-8").splitlines()
            self.assertTrue(any(call.startswith("run ") for call in go_calls))
            self.assertTrue(any(call.startswith("test ") for call in go_calls))


if __name__ == "__main__":
    unittest.main()
