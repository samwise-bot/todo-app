import './globals.css';

export const metadata = {
  title: 'TODO App',
  description: 'GTD + Kanban app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
