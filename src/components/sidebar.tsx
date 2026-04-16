'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { agents } from '@/lib/agents'
import { workflows } from '@/lib/workflows'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from '@/lib/types'

interface SidebarProps {
  conversations: Conversation[]
  userEmail?: string
  userName?: string
  isAdmin?: boolean
}

function ConversationItem({ conv, isActive }: { conv: Conversation; isActive: boolean }) {
  const agent = agents.find((a) => a.id === conv.agent_id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(conv.title)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleRename = async () => {
    if (!title.trim()) return
    const supabase = createClient()
    await supabase
      .from('conversations')
      .update({ title: title.trim() })
      .eq('id', conv.id)
    setIsRenaming(false)
    setMenuOpen(false)
    router.refresh()
  }

  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from('conversations').delete().eq('id', conv.id)
    setMenuOpen(false)
    router.push('/assistants')
    router.refresh()
  }

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 px-3 py-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename()
            if (e.key === 'Escape') { setIsRenaming(false); setTitle(conv.title) }
          }}
          onBlur={handleRename}
          className="flex-1 text-sm px-2 py-1 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    )
  }

  return (
    <div className="group relative flex items-center">
      <Link
        href={`/assistants/${conv.agent_id}/${conv.id}`}
        className={`flex-1 min-w-0 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors pr-8 ${
          isActive
            ? 'bg-surface-secondary shadow-sm text-foreground'
            : 'text-muted hover:bg-surface-secondary hover:text-foreground'
        }`}
      >
        <span className="text-sm shrink-0">{agent?.emoji ?? '💬'}</span>
        <span className="truncate">{conv.title}</span>
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen) }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-secondary text-muted hover:text-foreground transition-all absolute right-1 top-1/2 -translate-y-1/2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            <button
              onClick={() => { setIsRenaming(true); setMenuOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-surface-secondary transition-colors"
            >
              Umbenennen
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Löschen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function UserMenu({ userEmail, userName, isAdmin }: { userEmail: string; userName: string; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface-secondary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{userName || userEmail}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-white dark:bg-surface border-2 border-primary/20 rounded-xl shadow-xl overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 bg-primary/8 border-b-2 border-primary/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userName || 'Nutzer'}</p>
                <p className="text-xs text-muted truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <div className="py-0.5">
            <Link
              href="/assistants/path"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-1 text-sm text-foreground hover:bg-surface-secondary transition-colors"
            >
              <span className="text-sm leading-none">🎯</span>
              Mein Lernpfad
            </Link>
            <Link
              href="/assistants/library"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-1 text-sm text-foreground hover:bg-surface-secondary transition-colors"
            >
              <span className="text-sm leading-none">📚</span>
              Bibliothek
            </Link>
            <Link
              href="/assistants/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-1 text-sm text-foreground hover:bg-surface-secondary transition-colors"
            >
              <span className="text-sm leading-none">🧠</span>
              Wissensbasis
            </Link>
            {isAdmin && (
              <Link
                href="/assistants/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-1 text-sm text-foreground hover:bg-surface-secondary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                  <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
                Admin-Bereich
              </Link>
            )}
          </div>

          {/* Logout — clearly separated */}
          <div className="border-t border-border py-0.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Sidebar({ conversations, userEmail, userName, isAdmin }: SidebarProps) {
  const pathname = usePathname()

  // Conversations are already sorted by updated_at DESC from the server query
  return (
    <aside className="w-72 bg-surface border-r border-border flex flex-col h-full shrink-0">
      {/* Logo + Zurück */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <Link href="/assistants">
          <img src="/logo.png" alt="Herr Tech" className="h-6 w-auto" />
        </Link>
        <Link
          href="/dashboard"
          className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
          title="Zurück zur Übersicht"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Übersicht
        </Link>
      </div>

      {/* New Conversation Button */}
      <div className="px-4 pb-4">
        <Link
          href="/assistants/chat"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Neuer Chat
        </Link>
      </div>

      {/* Agents + Conversations */}
      <div className="flex-1 overflow-y-auto border-t border-border">
        {/* Agents */}
        <div className="p-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Workspace-Assistenten
          </h2>
          <nav className="space-y-1">
            {agents.map((agent) => {
              const isActive = pathname.startsWith(`/assistants/${agent.id}`)
              return (
                <Link
                  key={agent.id}
                  href={`/assistants/${agent.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-surface-secondary shadow-sm text-foreground font-medium border border-border'
                      : 'text-muted hover:bg-surface-secondary hover:text-foreground'
                  }`}
                >
                  <span className="text-base shrink-0">{agent.emoji}</span>
                  <span className="truncate">{agent.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Workflows */}
        <div className="p-4 border-t border-border">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Workflows
          </h2>
          <nav className="space-y-1">
            {workflows.map((workflow) => {
              const isActive = pathname.startsWith(`/assistants/workflows/${workflow.id}`)
              return (
                <Link
                  key={workflow.id}
                  href={`/assistants/workflows/${workflow.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-surface-secondary shadow-sm text-foreground font-medium border border-border'
                      : 'text-muted hover:bg-surface-secondary hover:text-foreground'
                  }`}
                >
                  <span className="text-base shrink-0">{workflow.emoji}</span>
                  <span className="truncate">{workflow.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>


        {/* Conversations */}
        {conversations.length > 0 && (
          <div className="p-4 border-t border-border">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Letzte Chats
            </h2>
            <nav className="space-y-0.5">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={pathname.includes(conv.id)}
                />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom — User Profile Dropdown */}
      <div className="border-t border-border">
        <UserMenu
          userEmail={userEmail ?? ''}
          userName={userName ?? ''}
          isAdmin={isAdmin}
        />
      </div>
    </aside>
  )
}
