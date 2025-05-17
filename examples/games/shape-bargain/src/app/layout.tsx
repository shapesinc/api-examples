import type { Metadata } from "next";
import "./globals.css";
import { Pixelify_Sans } from 'next/font/google';
import { Press_Start_2P } from 'next/font/google';

const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-pixelify',
});

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start',
});

export const metadata: Metadata = {
  title: "Merchant of Venice",
  description: "Can you haggle your way to the best deal?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`antialiased ${pressStart2P.variable} ${pixelifySans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
