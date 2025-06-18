// src/app/dashboard/layout.tsx
import { Sidebar } from '@/components/sidebar'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Dashboard – SendOffer Admin',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
