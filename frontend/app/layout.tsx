import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Section9 TeamC',
  description: 'Child Challenge Tracking Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}