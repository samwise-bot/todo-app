#!/usr/bin/env python3
"""Lightweight local benchmark for TODO App task/board read endpoints."""

from __future__ import annotations

import argparse
import json
import statistics
import time
import urllib.request
from typing import Dict, Iterable, List


def percentile(samples: List[float], pct: float) -> float:
    if not samples:
        return 0.0
    ordered = sorted(samples)
    if len(ordered) == 1:
        return ordered[0]
    rank = (len(ordered) - 1) * pct
    low = int(rank)
    high = min(low + 1, len(ordered) - 1)
    weight = rank - low
    return ordered[low] * (1 - weight) + ordered[high] * weight


def hit(url: str) -> float:
    start = time.perf_counter()
    with urllib.request.urlopen(url, timeout=10) as resp:
        _ = resp.read()
    return (time.perf_counter() - start) * 1000.0


DEFAULT_SLA_P95_MS: Dict[str, float] = {
    "/api/tasks?page=1&pageSize=50": 350.0,
    "/api/boards": 200.0,
    "/api/columns": 200.0,
}


def evaluate_sla(summary: Dict[str, dict], p95_targets_ms: Dict[str, float]) -> dict:
    endpoints = {}
    all_pass = True
    for path, target in p95_targets_ms.items():
        measured = float(summary.get(path, {}).get("p95_ms", 0.0))
        ok = measured <= target
        all_pass = all_pass and ok
        endpoints[path] = {"p95_ms": measured, "target_p95_ms": target, "ok": ok}
    return {"allPassed": all_pass, "endpoints": endpoints}


def run(base_url: str, iterations: int, delay_ms: float = 0.0) -> dict:
    endpoints = ["/api/tasks?page=1&pageSize=50", "/api/boards", "/api/columns"]
    timings = {path: [] for path in endpoints}

    started = time.perf_counter()
    for _ in range(iterations):
        for path in endpoints:
            timings[path].append(hit(f"{base_url}{path}"))
            if delay_ms > 0:
                time.sleep(delay_ms / 1000.0)
    elapsed_ms = (time.perf_counter() - started) * 1000.0

    summary = {}
    for path, samples in timings.items():
        avg_ms = statistics.fmean(samples)
        summary[path] = {
            "count": len(samples),
            "p50_ms": round(percentile(samples, 0.50), 2),
            "p95_ms": round(percentile(samples, 0.95), 2),
            "avg_ms": round(avg_ms, 2),
            "max_ms": round(max(samples), 2),
            "throughput_rps": round((1000.0 / avg_ms) if avg_ms > 0 else 0.0, 2),
        }

    summary["_meta"] = {
        "elapsed_ms": round(elapsed_ms, 2),
        "delay_ms": delay_ms,
        "total_requests": len(endpoints) * iterations,
    }
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8080")
    parser.add_argument("--iterations", type=int, default=10)
    parser.add_argument("--output", default=".run/benchmark-task-board.json")
    parser.add_argument("--delay-ms", type=float, default=0.0)
    args = parser.parse_args()

    summary = run(args.base_url, args.iterations, args.delay_ms)
    result = {
        "baseUrl": args.base_url,
        "iterations": args.iterations,
        "summary": summary,
        "sla": evaluate_sla(summary, DEFAULT_SLA_P95_MS),
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
