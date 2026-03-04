import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/navigation', () => ({
  usePathname: () => '/tasks'
}));

import { TopNav } from '../app/ui/top-nav';

describe('top nav', () => {
  test('marks active route and exposes quick-create action', () => {
    const html = renderToStaticMarkup(<TopNav />);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/board#quick-create-task"');
    expect(html).toContain('+ Quick create');
  });
});
