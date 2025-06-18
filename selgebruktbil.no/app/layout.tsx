// src/app/layout.tsx
'use client';

import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import type { ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="no">
      <body className={`${inter.className} bg-gray-50`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
