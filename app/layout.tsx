import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brotinho — Cada fase, com amor',
  description: 'App de parentalidade para pais brasileiros. Do pré-natal ao 1º aninho.',
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Brotinho',
    description: 'O app que acompanha cada fase do seu bebê.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
