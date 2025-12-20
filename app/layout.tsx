import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'LiveVote – Crea sondaggi istantanei',
  description: 'Crea una votazione in 10 secondi e condividi il link. Nessun login.',
  openGraph: {
    title: 'LiveVote – Crea sondaggi istantanei',
    description: 'Crea una votazione in 10 secondi e condividi il link. Nessun login.',
    url: 'https://livevote-tau.vercel.app/',
    siteName: 'LiveVote',
    images: [
      {
        url: 'https://livevote-tau.vercel.app/og.png',
        width: 1200,
        height: 630,
        alt: 'LiveVote',
      },
    ],
    locale: 'it_IT',
    type: 'website',
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
