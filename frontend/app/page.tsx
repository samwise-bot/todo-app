import { createProjectAction, createTaskAction, transitionTaskStateAction } from './actions';

const states = ['inbox', 'next', 'waiting', 'scheduled', 'someday', 'reference', 'done'];

async function fetchJSON(path: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${path}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function HomePage() {
  const [projects, tasks] = await Promise.all([
    fetchJSON('/api/projects'),
    fetchJSON('/api/tasks')
  ]);

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
              {states.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
            <button type="submit">Create task</button>
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
        <h2>Tasks</h2>
        <ul>
          {tasks.map((t: any) => (
            <li key={t.id} style={{ marginBottom: 12 }}>
              <strong>{t.title}</strong> - {t.state}
              <form action={transitionTaskStateAction} style={{ display: 'inline-flex', marginLeft: 10, gap: 6 }}>
                <input type="hidden" name="taskId" value={t.id} />
                <select name="state" defaultValue={t.state}>
                  {states.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
                <button type="submit">Move</button>
              </form>
            </li>
          ))}
        </ul>
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
