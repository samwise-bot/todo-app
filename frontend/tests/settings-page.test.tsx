import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import SettingsPage from '../app/settings/page';

describe('settings page', () => {
  test('renders advanced controls and default SWR value', () => {
    vi.stubEnv('TODO_APP_SWR_SECONDS', '');

    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Advanced settings');
    expect(html).toContain('Read cache policy (TODO_APP_SWR_SECONDS)');
    expect(html).toContain('30 (default)');
    expect(html).toContain('Board-first focus defaults');

    vi.unstubAllEnvs();
  });

  test('renders no-store label when SWR seconds is set to zero', () => {
    vi.stubEnv('TODO_APP_SWR_SECONDS', '0');

    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('0 (no-store)');

    vi.unstubAllEnvs();
  });
});
