import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const usePathnameMock = vi.fn(() => '/tasks');

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock()
}));

import { TopNav } from '../app/ui/top-nav';

describe('top nav', () => {
  test.each(['/tasks', '/projects', '/people', '/settings'])(
    'marks non-board route %s as active and keeps quick-create action',
    (route) => {
      usePathnameMock.mockReturnValue(route);
      const html = renderToStaticMarkup(<TopNav />);
      expect(html).toContain('aria-current="page"');
      expect(html).toContain(`href="${route}"`);
      expect(html).toContain('href="/board#quick-create-task"');
      expect(html).toContain('+ Quick create');
    }
  );
});
