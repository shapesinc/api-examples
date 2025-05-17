import './globals.css';

export const metadata = {
  title: 'Shapes Chat',
  description: 'A modern chat application using Shapes.inc API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
