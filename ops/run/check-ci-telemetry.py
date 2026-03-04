#!/usr/bin/env python3
import argparse
import csv
import glob
import json
from collections import defaultdict
from pathlib import Path


def load_telemetry(telemetry_dir: Path) -> dict[str, dict]:
    records: dict[str, dict] = {}
    pattern = str(telemetry_dir / "*.json")
    for file_path in sorted(glob.glob(pattern)):
        path = Path(file_path)
        data = json.loads(path.read_text(encoding="utf-8"))
        job_id = data.get("job_id")
        if not job_id:
            continue
        records[job_id] = data
    return records


def load_history(history_csv: Path, window: int) -> dict[str, list[float]]:
    history: dict[str, list[float]] = defaultdict(list)
    if not history_csv.exists() or window <= 0:
        return {}
    with history_csv.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            job_id = (row.get("job_id") or "").strip()
            if not job_id:
                continue
            try:
                duration = float(row.get("duration_seconds", ""))
            except (TypeError, ValueError):
                continue
            history[job_id].append(duration)

    return {job_id: values[-window:] for job_id, values in history.items()}


def allowed_duration(baseline: float, pct: float, seconds: float) -> float:
    return max(baseline * (1.0 + (pct / 100.0)), baseline + seconds)


def evaluate_job(job_id: str, cfg: dict, telemetry: dict, history: dict[str, list[float]] | None = None) -> dict:
    failures: list[str] = []

    timing = telemetry.get("timing", {})
    duration = float(timing.get("duration_seconds", 0.0))

    baseline = cfg.get("baseline_duration_seconds")
    pct_limit = float(cfg.get("max_duration_regression_percent", 0.0))
    sec_limit = float(cfg.get("max_duration_regression_seconds", 0.0))

    allowed = None
    regression_seconds = None
    regression_percent = None

    if baseline is not None:
        baseline_f = float(baseline)
        allowed = allowed_duration(baseline_f, pct_limit, sec_limit)
        regression_seconds = duration - baseline_f
        if baseline_f > 0:
            regression_percent = (regression_seconds / baseline_f) * 100.0
        if duration > allowed:
            failures.append(
                f"duration {duration:.2f}s exceeds allowed {allowed:.2f}s (baseline {baseline_f:.2f}s, max +{pct_limit:.2f}% or +{sec_limit:.2f}s)"
            )

    cache_hits = telemetry.get("cache_hits", {})
    miss_count = sum(1 for value in cache_hits.values() if value == "miss")
    hit_count = sum(1 for value in cache_hits.values() if value == "hit")
    unknown_count = sum(1 for value in cache_hits.values() if value == "unknown")

    history_values = (history or {}).get(job_id, [])
    history_average = None
    history_regression_seconds = None
    history_regression_percent = None
    if history_values:
        history_average = sum(history_values) / len(history_values)
        history_regression_seconds = duration - history_average
        if history_average > 0:
            history_regression_percent = (history_regression_seconds / history_average) * 100.0
        if "max_history_regression_percent" in cfg and history_regression_percent is not None:
            max_history_regression_percent = float(cfg["max_history_regression_percent"])
            if history_regression_percent > max_history_regression_percent:
                failures.append(
                    f"historical duration regression {history_regression_percent:.2f}% exceeds allowed {max_history_regression_percent:.2f}% (history avg {history_average:.2f}s)"
                )

    if "max_cache_misses" in cfg:
        max_cache_misses = int(cfg["max_cache_misses"])
        if miss_count > max_cache_misses:
            failures.append(
                f"cache misses {miss_count} exceed allowed {max_cache_misses}"
            )

    status = "pass" if not failures else "fail"

    return {
        "job_id": job_id,
        "status": status,
        "duration_seconds": duration,
        "baseline_duration_seconds": baseline,
        "allowed_duration_seconds": allowed,
        "regression_seconds": regression_seconds,
        "regression_percent": regression_percent,
        "cache_hit_count": hit_count,
        "cache_miss_count": miss_count,
        "cache_unknown_count": unknown_count,
        "history_sample_size": len(history_values),
        "history_average_duration_seconds": history_average,
        "history_regression_seconds": history_regression_seconds,
        "history_regression_percent": history_regression_percent,
        "reasons": failures,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare CI telemetry against regression thresholds")
    parser.add_argument("--thresholds", required=True)
    parser.add_argument("--telemetry-dir", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--output-csv", required=True)
    parser.add_argument("--history-csv")
    parser.add_argument("--history-window", type=int, default=10)
    args = parser.parse_args()

    threshold_doc = json.loads(Path(args.thresholds).read_text(encoding="utf-8"))
    default_cfg = threshold_doc.get("defaults", {})
    jobs_cfg = threshold_doc.get("jobs", {})

    telemetry = load_telemetry(Path(args.telemetry_dir))
    history = load_history(Path(args.history_csv), args.history_window) if args.history_csv else {}

    results: list[dict] = []
    failures: list[str] = []

    for job_id, raw_job_cfg in jobs_cfg.items():
        cfg = {**default_cfg, **raw_job_cfg}
        if job_id not in telemetry:
            failures.append(f"missing telemetry for configured job '{job_id}'")
            results.append(
                {
                    "job_id": job_id,
                    "status": "fail",
                    "duration_seconds": None,
                    "baseline_duration_seconds": cfg.get("baseline_duration_seconds"),
                    "allowed_duration_seconds": None,
                    "regression_seconds": None,
                    "regression_percent": None,
                    "cache_hit_count": None,
                    "cache_miss_count": None,
                    "cache_unknown_count": None,
                    "history_sample_size": None,
                    "history_average_duration_seconds": None,
                    "history_regression_seconds": None,
                    "history_regression_percent": None,
                    "reasons": ["missing telemetry artifact"],
                }
            )
            continue

        result = evaluate_job(job_id, cfg, telemetry[job_id], history=history)
        if result["status"] == "fail":
            failures.extend([f"{job_id}: {reason}" for reason in result["reasons"]])
        results.append(result)

    summary = {
        "schema_version": 1,
        "thresholds_path": args.thresholds,
        "telemetry_dir": args.telemetry_dir,
        "result": "pass" if not failures else "fail",
        "failures": failures,
        "jobs": results,
    }

    output_json = Path(args.output_json)
    output_csv = Path(args.output_csv)
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    output_json.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    with output_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "job_id",
                "status",
                "duration_seconds",
                "baseline_duration_seconds",
                "allowed_duration_seconds",
                "regression_seconds",
                "regression_percent",
                "cache_hit_count",
                "cache_miss_count",
                "cache_unknown_count",
                "history_sample_size",
                "history_average_duration_seconds",
                "history_regression_seconds",
                "history_regression_percent",
                "reasons",
            ]
        )
        for item in results:
            writer.writerow(
                [
                    item["job_id"],
                    item["status"],
                    item["duration_seconds"],
                    item["baseline_duration_seconds"],
                    item["allowed_duration_seconds"],
                    item["regression_seconds"],
                    item["regression_percent"],
                    item["cache_hit_count"],
                    item["cache_miss_count"],
                    item["cache_unknown_count"],
                    item["history_sample_size"],
                    item["history_average_duration_seconds"],
                    item["history_regression_seconds"],
                    item["history_regression_percent"],
                    " | ".join(item["reasons"]),
                ]
            )

    if failures:
        print("CI telemetry regression gate failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("CI telemetry regression gate passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
