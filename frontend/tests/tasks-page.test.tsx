import React from 'react';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import TasksPage from '../app/tasks/page';

describe('tasks page', () => {
  test('renders task workspace scaffold', () => {
    const html = renderToStaticMarkup(<TasksPage />);
    expect(html).toContain('Task workspace');
    expect(html).toContain('board-first IA split');
  });
});
