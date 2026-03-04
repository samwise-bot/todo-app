import { TopNav } from './ui/top-nav';

import './globals.css';

export const metadata = {
  title: 'TODO App',
  description: 'GTD + Kanban app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top-nav-shell">
          <TopNav />
        </header>
        {children}
      </body>
    </html>
  );
}
