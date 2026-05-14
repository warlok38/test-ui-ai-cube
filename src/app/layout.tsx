'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Layout } from '@/components'
import { useGlobalFontSize } from '@/hooks'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const fontSize = useGlobalFontSize()

  return (
    <html lang="ru" style={{ fontSize }} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
}
