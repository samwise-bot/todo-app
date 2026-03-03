import { createProjectAction } from './actions';
import { TASK_STATES } from '../lib/task-states';
import {
  AssignTaskForm,
  CreateBoardForm,
  CreateColumnForm,
  CreatePrincipalForm,
  CreateTaskForm,
  DeleteBoardForm,
  DeleteColumnForm,
  SetTaskBoardColumnForm,
  TransitionTaskStateForm,
  UpdateBoardForm,
  UpdateColumnForm
} from './action-forms';

async function fetchJSON(path: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${path}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function HomePage() {
  const [projects, principals, boards, columns, tasks] = await Promise.all([
    fetchJSON('/api/projects'),
    fetchJSON('/api/principals'),
    fetchJSON('/api/boards'),
    fetchJSON('/api/columns'),
    fetchJSON('/api/tasks')
  ]);
  const columnsByBoard = new Map<number, any[]>();
  const columnsByID = new Map<number, any>();
  for (const column of columns) {
    const bucket = columnsByBoard.get(column.boardId) ?? [];
    bucket.push(column);
    columnsByBoard.set(column.boardId, bucket);
    columnsByID.set(column.id, column);
  }

  const boardsByID = new Map<number, any>();
  for (const board of boards) {
    boardsByID.set(board.id, board);
  }

  const taskColumns = columns.map((column: any) => {
    const boardName = boardsByID.get(column.boardId)?.name ?? `Board ${column.boardId}`;
    return { id: column.id, label: `${boardName} / ${column.name}` };
  });

  const tasksByColumn = new Map<number, any[]>();
  const tasksWithoutColumn: any[] = [];
  for (const task of tasks) {
    if (!task.boardColumnId || !columnsByID.has(task.boardColumnId)) {
      tasksWithoutColumn.push(task);
      continue;
    }
    const bucket = tasksByColumn.get(task.boardColumnId) ?? [];
    bucket.push(task);
    tasksByColumn.set(task.boardColumnId, bucket);
  }

  return (
    <main style={{ maxWidth: 980, margin: '2rem auto', fontFamily: 'Inter, sans-serif', padding: '0 1rem' }}>
      <h1>GTD + Kanban TODO App</h1>
      <p>Bootstrap UI showing live data from Go API.</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <form action={createProjectAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h2>Create project</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            <input name="name" placeholder="Project name" required />
            <input name="description" placeholder="Description" />
            <button type="submit">Create project</button>
          </div>
        </form>

        <CreateTaskForm projects={projects} taskColumns={taskColumns} />
        <CreatePrincipalForm />
      </section>

      <section>
        <h2>Projects</h2>
        <ul>
          {projects.map((p: any) => <li key={p.id}>{p.name}</li>)}
        </ul>
      </section>

      <section>
        <h2>Principals</h2>
        <ul>
          {principals.map((p: any) => (
            <li key={p.id}>
              {p.displayName} ({p.kind}) - @{p.handle}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Tasks</h2>
        <ul>
          {tasks.map((t: any) => (
            <li key={t.id} style={{ marginBottom: 12 }}>
              <strong>{t.title}</strong> - {t.state}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                <TransitionTaskStateForm task={t} />
                <AssignTaskForm task={t} principals={principals} />
                <SetTaskBoardColumnForm task={t} taskColumns={taskColumns} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Board management</h2>
        <CreateBoardForm projects={projects} />

        {boards.map((board: any) => (
          <article key={board.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <h3>{board.name}</h3>
            <UpdateBoardForm board={board} />
            <DeleteBoardForm boardId={board.id} />

            <CreateColumnForm boardId={board.id} />

            <ul style={{ marginTop: 10 }}>
              {(columnsByBoard.get(board.id) ?? []).map((column: any) => (
                <li key={column.id} style={{ marginBottom: 8 }}>
                  <UpdateColumnForm column={column} />
                  <DeleteColumnForm columnId={column.id} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Kanban lanes (by board columns)</h2>
        <div style={{ marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
          <h3>No column</h3>
          <ul>
            {tasksWithoutColumn.map((task: any) => <li key={task.id}>{task.title} ({task.state})</li>)}
          </ul>
        </div>
        {boards.map((board: any) => (
          <article key={board.id} style={{ marginBottom: 12 }}>
            <h3>{board.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {(columnsByBoard.get(board.id) ?? []).map((column: any) => (
                <div key={column.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                  <h4 style={{ marginTop: 0 }}>{column.name}</h4>
                  <ul>
                    {(tasksByColumn.get(column.id) ?? []).map((task: any) => <li key={task.id}>{task.title} ({task.state})</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
        {boards.length === 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            No boards yet.
          </div>
        )}
        {boards.length > 0 && columns.length === 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            Boards exist but no columns are defined yet.
          </div>
        )}
        {boards.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            Tasks appear in board lanes only when assigned to a board column.
          </div>
        )}
      </section>

      <section>
        <h2>Task states</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {TASK_STATES.map((lane) => (
            <div key={lane} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
              <h3 style={{ textTransform: 'capitalize' }}>{lane}</h3>
              <ul>
                {tasks.filter((t: any) => t.state === lane).map((t: any) => <li key={t.id}>{t.title}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
