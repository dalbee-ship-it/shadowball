import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Mega Launcher',
  description: 'Active Agent Monitor',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif", backgroundColor: 'var(--bg)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
