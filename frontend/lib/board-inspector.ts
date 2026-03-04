type TaskLike = {
  state: string;
  assigneeId?: number | null;
  dueAt?: string | null;
};

export type BoardInspectorMetrics = {
  nextCount: number;
  inProgressCount: number;
  blockedCount: number;
  unassignedCount: number;
  overdueCount: number;
  dueSoonCount: number;
};

export function buildBoardInspectorMetrics(tasks: TaskLike[], now = new Date()): BoardInspectorMetrics {
  const nowMs = now.getTime();
  const dueSoonWindowMs = nowMs + 24 * 60 * 60 * 1000;

  return tasks.reduce<BoardInspectorMetrics>(
    (acc, task) => {
      if (task.state === 'next') {
        acc.nextCount += 1;
      }
      if (task.state === 'scheduled') {
        acc.inProgressCount += 1;
      }
      if (task.state === 'waiting') {
        acc.blockedCount += 1;
      }
      if (task.assigneeId == null) {
        acc.unassignedCount += 1;
      }

      if (task.dueAt && task.state !== 'done') {
        const dueMs = Date.parse(task.dueAt);
        if (!Number.isNaN(dueMs)) {
          if (dueMs < nowMs) {
            acc.overdueCount += 1;
          } else if (dueMs <= dueSoonWindowMs) {
            acc.dueSoonCount += 1;
          }
        }
      }

      return acc;
    },
    { nextCount: 0, inProgressCount: 0, blockedCount: 0, unassignedCount: 0, overdueCount: 0, dueSoonCount: 0 }
  );
}
