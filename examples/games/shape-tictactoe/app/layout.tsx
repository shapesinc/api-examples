import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shape Tic-Tac-Toe',
  description: 'Play Tic-Tac-Toe against a shape.,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
