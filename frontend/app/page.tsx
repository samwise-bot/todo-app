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
            <li key={t.id}><strong>{t.title}</strong> — {t.state}</li>
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
