import React from 'react';

type SettingControl = {
  id: string;
  label: string;
  value: string;
  description: string;
};

function resolveSWRSeconds(): string {
  const configured = process.env.TODO_APP_SWR_SECONDS;
  if (configured === undefined || configured === '') {
    return '30 (default)';
  }
  return configured === '0' ? '0 (no-store)' : configured;
}

export default function SettingsPage() {
  const controls: SettingControl[] = [
    {
      id: 'swr-seconds',
      label: 'Read cache policy (TODO_APP_SWR_SECONDS)',
      value: resolveSWRSeconds(),
      description:
        'Controls stale-while-revalidate caching for route data fetches. Set to 0 for no-store debugging mode.'
    },
    {
      id: 'focus-default',
      label: 'Board-first focus defaults',
      value: 'taskState=next,scheduled • taskAssigneeId=2',
      description: 'Default board route opens focused on active work assigned to Samwise for execution loops.'
    },
    {
      id: 'roadmap-scope',
      label: 'Current roadmap scope',
      value: 'Phase 2 route extraction + interaction reliability',
      description: 'Tracks current migration band so power-users can validate scope before enabling deeper feature flags.'
    }
  ];

  return (
    <main className="app-shell">
      <section className="panel" id="advanced-controls">
        <p className="eyebrow">Settings</p>
        <h1>Advanced settings</h1>
        <p className="muted">Operational controls and current runtime defaults for TODO App power users.</p>
        <ul className="stack" aria-label="Advanced configuration controls">
          {controls.map((control) => (
            <li key={control.id} className="panel" style={{ padding: '0.75rem' }}>
              <p className="eyebrow">{control.label}</p>
              <p>
                <strong>{control.value}</strong>
              </p>
              <p className="muted">{control.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
