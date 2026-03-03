import {
  assignTaskAction,
  createBoardAction,
  createColumnAction,
  createPrincipalAction,
  createProjectAction,
  createTaskAction,
  deleteBoardAction,
  deleteColumnAction,
  transitionTaskStateAction,
  updateBoardAction,
  updateColumnAction
} from './actions';
import { TASK_STATES } from '../lib/task-states';

async function fetchJSON(path: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${path}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
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
  for (const column of columns) {
    const bucket = columnsByBoard.get(column.boardId) ?? [];
    bucket.push(column);
    columnsByBoard.set(column.boardId, bucket);
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

        <form action={createTaskAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h2>Create task</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            <input name="title" placeholder="Task title" required />
            <input name="description" placeholder="Description" />
            <select name="projectId" defaultValue="">
              <option value="">No project</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select name="state" defaultValue="inbox">
              {TASK_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
            <button type="submit">Create task</button>
          </div>
        </form>

        <form action={createPrincipalAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h2>Create principal</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            <select name="kind" defaultValue="human">
              <option value="human">human</option>
              <option value="agent">agent</option>
            </select>
            <input name="handle" placeholder="handle (alice, agent.ops)" required />
            <input name="displayName" placeholder="Display name" required />
            <button type="submit">Create principal</button>
          </div>
        </form>
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
                <form action={transitionTaskStateAction} style={{ display: 'inline-flex', gap: 6 }}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <select name="state" defaultValue={t.state}>
                    {TASK_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <button type="submit">Move</button>
                </form>
                <form action={assignTaskAction} style={{ display: 'inline-flex', gap: 6 }}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <select name="assigneeId" defaultValue={t.assigneeId ?? ''}>
                    <option value="">Unassigned</option>
                    {principals.map((p: any) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                  <button type="submit">{t.assigneeId ? 'Reassign' : 'Assign'}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Board management</h2>
        <form action={createBoardAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <h3>Create board</h3>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 2fr auto' }}>
            <input name="name" placeholder="Board name" required />
            <select name="projectId" defaultValue="">
              <option value="" disabled>Select project</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="submit">Create</button>
          </div>
        </form>

        {boards.map((board: any) => (
          <article key={board.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <h3>{board.name}</h3>
            <form action={updateBoardAction} style={{ display: 'inline-flex', gap: 6, marginRight: 8 }}>
              <input type="hidden" name="boardId" value={board.id} />
              <input name="name" defaultValue={board.name} required />
              <button type="submit">Rename</button>
            </form>
            <form action={deleteBoardAction} style={{ display: 'inline-flex' }}>
              <input type="hidden" name="boardId" value={board.id} />
              <button type="submit">Delete board</button>
            </form>

            <form action={createColumnAction} style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr auto', marginTop: 10 }}>
              <input type="hidden" name="boardId" value={board.id} />
              <input name="name" placeholder="New column name" required />
              <input name="position" type="number" defaultValue={0} />
              <button type="submit">Add column</button>
            </form>

            <ul style={{ marginTop: 10 }}>
              {(columnsByBoard.get(board.id) ?? []).map((column: any) => (
                <li key={column.id} style={{ marginBottom: 8 }}>
                  <form action={updateColumnAction} style={{ display: 'inline-flex', gap: 6, marginRight: 8 }}>
                    <input type="hidden" name="columnId" value={column.id} />
                    <input name="name" defaultValue={column.name} required />
                    <input name="position" type="number" defaultValue={column.position} required />
                    <button type="submit">Update column</button>
                  </form>
                  <form action={deleteColumnAction} style={{ display: 'inline-flex' }}>
                    <input type="hidden" name="columnId" value={column.id} />
                    <button type="submit">Delete</button>
                  </form>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Kanban lanes (derived)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {['inbox', 'next', 'waiting', 'done'].map((lane) => (
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
