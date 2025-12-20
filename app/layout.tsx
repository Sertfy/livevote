import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'LiveVote – Crea sondaggi istantanei',
  description: 'Crea una votazione in 10 secondi e condividi il link. Nessun login.',
  metadataBase: new URL('https://livevote-tau.vercel.app'),
  openGraph: {
    title: 'LiveVote – Crea sondaggi istantanei',
    description: 'Crea una votazione in 10 secondi e condividi il link. Nessun login.',
    url: 'https://livevote-tau.vercel.app',
    siteName: 'LiveVote',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'LiveVote' }],
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiveVote – Crea sondaggi istantanei',
    description: 'Crea una votazione in 10 secondi e condividi il link. Nessun login.',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 text-zinc-900`}>
        {children}
      </body>
    </html>
  )
}
