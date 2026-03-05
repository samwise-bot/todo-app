"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/board', label: 'Board' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/projects', label: 'Projects' },
  { href: '/people', label: 'People' },
  { href: '/settings', label: 'Settings' }
];

export function TopNav() {
  const pathname = usePathname();
  const quickJump =
    pathname === '/settings'
      ? { href: '/board', label: '← Back to board' }
      : pathname === '/board'
        ? { href: '/settings#advanced-controls', label: '⚙ Advanced controls' }
        : null;

  return (
    <nav className="top-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`top-nav-link${active ? ' top-nav-link-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      {quickJump && (
        <Link href={quickJump.href} className="top-nav-link top-nav-link-jump" aria-label="Board and settings quick jump">
          {quickJump.label}
        </Link>
      )}
      <Link href="/board#quick-create-task" className="top-nav-link top-nav-link-quick-create">
        + Quick create
      </Link>
    </nav>
  );
}
