'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import type { Conversation } from '@/lib/types'

interface AppShellProps {
  conversations: Conversation[]
  userEmail?: string
  userName?: string
  isAdmin?: boolean
  children: React.ReactNode
}

export function AppShell({ conversations, userEmail, userName, isAdmin, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)       // mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // desktop collapse
  const pathname = usePathname()

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out
          md:relative md:translate-x-0 md:flex md:shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'md:w-0 md:overflow-hidden' : 'md:w-auto'}
        `}
      >
        <Sidebar
          conversations={conversations}
          userEmail={userEmail}
          userName={userName}
          isAdmin={isAdmin}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Menü öffnen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img src="/logo.png" alt="Herr Tech" className="h-5 w-auto" />
        </div>

        {/* Desktop sidebar toggle — pinned top-left of main area */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex absolute top-3 left-3 z-30 items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
          aria-label={sidebarCollapsed ? 'Seitenleiste öffnen' : 'Seitenleiste schließen'}
          title={sidebarCollapsed ? 'Seitenleiste öffnen' : 'Seitenleiste schließen'}
        >
          {sidebarCollapsed ? (
            // › chevron right
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            // ‹ chevron left
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </button>

        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
