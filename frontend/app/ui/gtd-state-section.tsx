import React from 'react';
import { TASK_STATES } from '../../lib/task-states';

export function GTDStateSection({ tasks }: { tasks: Array<{ id: number; title: string; state: string }> }) {
  return (
    <section className="panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">GTD</p>
          <h2>State buckets</h2>
        </div>
      </div>
      <div className="gtd-grid">
        {TASK_STATES.map((lane) => {
          const stateTasks = tasks.filter((task) => task.state === lane);
          return (
            <article key={lane} className="gtd-lane">
              <div className="column-header-row">
                <h3>{lane}</h3>
                <span className="count-pill">{stateTasks.length}</span>
              </div>
              {stateTasks.length === 0 ? (
                <p className="muted">No tasks in this state.</p>
              ) : (
                <ul className="compact-list">
                  {stateTasks.map((task) => (
                    <li key={task.id}>{task.title}</li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
