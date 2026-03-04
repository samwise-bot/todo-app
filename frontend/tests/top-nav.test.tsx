import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const usePathnameMock = vi.fn(() => '/tasks');

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock()
}));

import { TopNav } from '../app/ui/top-nav';

describe('top nav', () => {
  test.each([
    ['/tasks', 'Tasks'],
    ['/projects', 'Projects'],
    ['/people', 'People'],
    ['/settings', 'Settings']
  ])(
    'marks non-board route %s as the only active nav item and keeps quick-create action',
    (route, label) => {
      usePathnameMock.mockReturnValue(route);
      const html = renderToStaticMarkup(<TopNav />);
      expect(html).toContain(`href="${route}"`);
      expect(html).toMatch(
        new RegExp(`aria-current="page"[^>]*href="${route}">${label}<`)
      );
      expect((html.match(/aria-current="page"/g) ?? []).length).toBe(1);
      expect(html).toContain('href="/board#quick-create-task"');
      expect(html).toContain('+ Quick create');
    }
  );
});
