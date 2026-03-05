type Board = {
  id: number;
  name: string;
};

type Column = {
  id: number;
  boardId: number;
  name: string;
};

type Task = {
  id: number;
  title: string;
  description?: string;
  state: string;
  assigneeId?: number | null;
  projectId?: number | null;
  boardColumnId?: number | null;
  priority?: number | null;
  dueAt?: string | null;
};

type BoardLaneColumn = {
  id: number;
  name: string;
  tasks: Task[];
};

type BoardLaneBoard = {
  id: number;
  name: string;
  columns: BoardLaneColumn[];
};

export type BoardLaneView = {
  boards: BoardLaneBoard[];
  tasksWithoutColumn: Task[];
  fetchErrors: string[];
};

function sortLaneTasks(columnName: string, tasks: Task[]): Task[] {
  const sorted = [...tasks];
  if (columnName.toLowerCase() === 'next') {
    sorted.sort((a, b) => {
      const aPriority = a.priority ?? 3;
      const bPriority = b.priority ?? 3;
      if (aPriority !== bPriority) return aPriority - bPriority;
      const aDue = a.dueAt ?? '9999-12-31T23:59:59Z';
      const bDue = b.dueAt ?? '9999-12-31T23:59:59Z';
      if (aDue !== bDue) return aDue.localeCompare(bDue);
      return a.id - b.id;
    });
  }
  return sorted;
}

export function buildBoardLaneView({
  boards,
  columns,
  tasks,
  fetchErrors
}: {
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  fetchErrors: string[];
}): BoardLaneView {
  const columnsByBoard = new Map<number, Column[]>();
  const columnsByID = new Map<number, Column>();
  for (const column of columns) {
    const bucket = columnsByBoard.get(column.boardId) ?? [];
    bucket.push(column);
    columnsByBoard.set(column.boardId, bucket);
    columnsByID.set(column.id, column);
  }

  const tasksByColumn = new Map<number, Task[]>();
  const tasksWithoutColumn: Task[] = [];
  for (const task of tasks) {
    if (!task.boardColumnId || !columnsByID.has(task.boardColumnId)) {
      tasksWithoutColumn.push(task);
      continue;
    }
    const bucket = tasksByColumn.get(task.boardColumnId) ?? [];
    bucket.push(task);
    tasksByColumn.set(task.boardColumnId, bucket);
  }

  const boardLanes: BoardLaneBoard[] = boards.map((board) => {
    const boardColumns = columnsByBoard.get(board.id) ?? [];
    return {
      id: board.id,
      name: board.name,
      columns: boardColumns.map((column) => ({
        id: column.id,
        name: column.name,
        tasks: sortLaneTasks(column.name, tasksByColumn.get(column.id) ?? [])
      }))
    };
  });

  return {
    boards: boardLanes,
    tasksWithoutColumn,
    fetchErrors
  };
}
