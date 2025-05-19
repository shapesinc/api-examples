import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shape Uno',
  description: 'Shape Uno: Uno game where the enemy is a shape.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
