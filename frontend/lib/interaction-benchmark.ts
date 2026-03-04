import { buildBoardLaneView } from './board-lanes';

type BenchmarkBoard = { id: number; name: string };
type BenchmarkColumn = { id: number; boardId: number; name: string };
type BenchmarkTask = {
  id: number;
  title: string;
  state: string;
  assigneeId?: number | null;
  projectId?: number | null;
  boardColumnId?: number | null;
  priority?: number | null;
  dueAt?: string | null;
};

export type BoardLaneAssemblyBenchmark = {
  iterations: number;
  taskCount: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  durationsMs: number[];
};

function percentile(sortedDurations: number[], p: number): number {
  if (!sortedDurations.length) return 0;
  const index = Math.min(sortedDurations.length - 1, Math.max(0, Math.ceil((p / 100) * sortedDurations.length) - 1));
  return sortedDurations[index];
}

export function benchmarkBoardLaneAssembly({
  boards,
  columns,
  tasks,
  fetchErrors = [],
  iterations = 30
}: {
  boards: BenchmarkBoard[];
  columns: BenchmarkColumn[];
  tasks: BenchmarkTask[];
  fetchErrors?: string[];
  iterations?: number;
}): BoardLaneAssemblyBenchmark {
  const cycleCount = Math.max(1, Math.floor(iterations));
  const durationsMs: number[] = [];

  for (let i = 0; i < cycleCount; i += 1) {
    const start = performance.now();
    buildBoardLaneView({ boards, columns, tasks, fetchErrors });
    durationsMs.push(performance.now() - start);
  }

  const sorted = [...durationsMs].sort((a, b) => a - b);
  const total = durationsMs.reduce((sum, value) => sum + value, 0);

  return {
    iterations: cycleCount,
    taskCount: tasks.length,
    avgMs: total / cycleCount,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted[sorted.length - 1] ?? 0,
    durationsMs
  };
}
