type StoreEntity = { id: number };

type TaskEntity = StoreEntity & {
  priority?: number | null;
  dueAt?: string | null;
  state?: string;
};

type AppStoreInput = {
  tasks: TaskEntity[];
  boards: StoreEntity[];
  columns: StoreEntity[];
  principals: StoreEntity[];
};

export type AppStoreSnapshot = {
  tasksById: Map<number, TaskEntity>;
  boardsById: Map<number, StoreEntity>;
  columnsById: Map<number, StoreEntity>;
  principalsById: Map<number, StoreEntity>;
  orderedNextTaskIds: number[];
};

function indexById<T extends StoreEntity>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function dueEpoch(task: TaskEntity): number {
  if (!task.dueAt) {
    return Number.POSITIVE_INFINITY;
  }
  const parsed = Date.parse(task.dueAt);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function nextComparator(a: TaskEntity, b: TaskEntity): number {
  const priorityA = a.priority ?? Number.POSITIVE_INFINITY;
  const priorityB = b.priority ?? Number.POSITIVE_INFINITY;
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  const dueA = dueEpoch(a);
  const dueB = dueEpoch(b);
  if (dueA !== dueB) {
    return dueA - dueB;
  }

  return a.id - b.id;
}

export function createAppStoreSnapshot(input: AppStoreInput): AppStoreSnapshot {
  const nextTasks = input.tasks.filter((task) => task.state === 'next').sort(nextComparator);

  return {
    tasksById: indexById(input.tasks),
    boardsById: indexById(input.boards),
    columnsById: indexById(input.columns),
    principalsById: indexById(input.principals),
    orderedNextTaskIds: nextTasks.map((task) => task.id)
  };
}
