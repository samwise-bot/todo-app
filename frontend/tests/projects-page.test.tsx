import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const { fetchCollectionMock } = vi.hoisted(() => ({
  fetchCollectionMock: vi.fn()
}));

vi.mock('../lib/api-client', () => ({
  fetchCollection: fetchCollectionMock
}));

import ProjectsPage from '../app/projects/page';

describe('projects page', () => {
  beforeEach(() => {
    fetchCollectionMock.mockReset();
  });

  test('renders project names from API response', async () => {
    fetchCollectionMock.mockResolvedValue({
      items: [
        { id: 1, name: 'TODO App' },
        { id: 2, name: 'Ops' }
      ],
      error: null
    });

    const html = renderToStaticMarkup(await ProjectsPage());
    expect(html).toContain('Projects workspace');
    expect(html).toContain('TODO App');
    expect(html).toContain('Ops');
    expect(fetchCollectionMock).toHaveBeenCalledWith('/api/projects', 'Projects');
  });
});
