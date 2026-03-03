import Link from 'next/link';

import './globals.css';

export const metadata = {
  title: 'TODO App',
  description: 'GTD + Kanban app'
};

const NAV_ITEMS = [
  { href: '/board', label: 'Board' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/projects', label: 'Projects' },
  { href: '/people', label: 'People' },
  { href: '/settings', label: 'Settings' }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top-nav-shell">
          <nav className="top-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="top-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
