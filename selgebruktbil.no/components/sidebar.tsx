// src/components/ui/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Music, Settings, LogOut, PanelBottom } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import Image from 'next/image'

export function Sidebar() {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: <PanelBottom size={16} /> },
    { href: '/settings', label: 'Settings',   icon: <Settings size={16} /> },
  ]

  return (
    <aside className="w-60 bg-white border-r flex flex-col">
      {/* Logo / Tittel */}
      <div className="px-6 py-8">
              <Image
                src="/gretland-logo-2025-white.png"
                alt="Gretland bil Logo"
                width={200}
                height={38.8}
                className="mb-6 bg-black"
              />
      </div>

      {/* Navigasjon */}
      <nav className="flex-1 px-4 space-y-2">
        {items.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 p-2 rounded transition
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout-knapp */}
      <div className="px-6 py-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut size={16} /> Logg ut
        </Button>
      </div>
    </aside>
  )
}
