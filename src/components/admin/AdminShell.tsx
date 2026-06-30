'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { ProteinoFAB } from '@/components/ProteinoFAB'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
  userId: string
}

export function AdminShell({ children, userName, userEmail, userId }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('adminSidebar')
    if (saved === 'collapsed') setCollapsed(true)
    setMounted(true)
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('adminSidebar', next ? 'collapsed' : 'expanded') } catch {}
  }

  // Prevent layout shift while reading localStorage
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#e4e4e4]">
        <div className="lg:ml-60 pt-14 lg:pt-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e4e4e4]">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={toggle}
        userName={userName}
        userEmail={userEmail}
      />
      <main className={`transition-[margin] duration-200 pt-14 lg:pt-0 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
      <ProteinoFAB userId={userId} />
    </div>
  )
}
