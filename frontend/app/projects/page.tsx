import React from 'react';

import { fetchCollection } from '../../lib/api-client';

type Project = { id: number; name: string; description?: string };

export default async function ProjectsPage() {
  const projectsResult = await fetchCollection<Project>('/api/projects', 'Projects');
  const projects = projectsResult.items;

  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">Projects</p>
        <h1>Projects workspace</h1>
        <p className="muted">Project-focused route for board-first IA split.</p>
        {projectsResult.error ? <div className="inline-alert" role="alert">{projectsResult.error}</div> : null}
        {projects.length === 0 ? (
          <div className="empty-state">No projects yet.</div>
        ) : (
          <ul className="compact-list" style={{ marginTop: 12 }}>
            {projects.map((project) => (
              <li key={project.id}>{project.name}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
