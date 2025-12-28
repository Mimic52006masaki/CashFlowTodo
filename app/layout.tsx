import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CashFlowTodo',
  description: 'Cash flow management todo app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}