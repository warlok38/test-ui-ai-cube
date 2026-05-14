'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Layout } from '@/components'
import { useGlobalFontSize } from '@/hooks'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const fontSize = useGlobalFontSize()

  return (
    <html lang="en" style={{ fontSize }} data-theme="light" suppressHydrationWarning>
      <body className={inter.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
