#!/usr/bin/env python3
"""Lightweight local benchmark for TODO App task/board read endpoints."""

from __future__ import annotations

import argparse
import json
import statistics
import time
import urllib.request
from typing import Iterable, List


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


def run(base_url: str, iterations: int) -> dict:
    endpoints = ["/api/tasks?page=1&pageSize=50", "/api/boards", "/api/columns"]
    timings = {path: [] for path in endpoints}

    for _ in range(iterations):
        for path in endpoints:
            timings[path].append(hit(f"{base_url}{path}"))

    summary = {}
    for path, samples in timings.items():
        summary[path] = {
            "count": len(samples),
            "p50_ms": round(percentile(samples, 0.50), 2),
            "p95_ms": round(percentile(samples, 0.95), 2),
            "avg_ms": round(statistics.fmean(samples), 2),
            "max_ms": round(max(samples), 2),
        }
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8080")
    parser.add_argument("--iterations", type=int, default=10)
    parser.add_argument("--output", default=".run/benchmark-task-board.json")
    args = parser.parse_args()

    result = {
        "baseUrl": args.base_url,
        "iterations": args.iterations,
        "summary": run(args.base_url, args.iterations),
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
