import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HelpChat } from './HelpChat'

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>
}) {
  const { chat: chatId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Alle Help-Conversations des Users
  const { data: helpConvs } = await supabase
    .from('conversations')
    .select('id, title, updated_at, mode, status')
    .eq('user_id', user.id)
    .eq('agent_id', 'help')
    .order('updated_at', { ascending: false })
    .limit(20)

  let activeConvId = chatId
  if (!activeConvId && helpConvs && helpConvs.length > 0) activeConvId = helpConvs[0].id

  if (!activeConvId) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, agent_id: 'help', title: 'Hilfe & Support' })
      .select('id')
      .single()
    activeConvId = newConv?.id
  }

  if (!activeConvId) {
    return <div className="p-8 text-center text-muted">Fehler beim Laden des Hilfe-Chats.</div>
  }

  const [{ data: conv }, { data: messages }] = await Promise.all([
    supabase.from('conversations').select('mode, status').eq('id', activeConvId).single(),
    supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', activeConvId)
      .order('created_at', { ascending: true }),
  ])

  const initialMessages = (messages ?? []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant' | 'admin' | 'system',
    content: m.content,
    created_at: m.created_at,
  }))

  const email = user.email ?? ''
  const initials = (user.user_metadata?.full_name as string | undefined)
    ? (user.user_metadata?.full_name as string).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full">
      {/* Header mit History */}
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm sm:text-base">Hilfe & Kontakt</h1>
            <p className="text-xs text-muted hidden sm:block">
              Frag mich alles — bei Bedarf verbinde ich dich mit dem Team.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {helpConvs && helpConvs.length > 1 && (
            <div className="hidden sm:flex items-center gap-1">
              {helpConvs.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/help?chat=${c.id}`}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                    c.id === activeConvId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {c.mode === 'human' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  {(c.title ?? 'Chat').substring(0, 20)}
                </Link>
              ))}
            </div>
          )}
          <NewHelpChatButton />
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <HelpChat
          conversationId={activeConvId}
          initialMessages={initialMessages}
          initialMode={(conv?.mode ?? 'ai') as 'ai' | 'human'}
          initialStatus={(conv?.status ?? 'new') as 'new' | 'answered' | 'resolved'}
          userInitials={initials}
        />
      </div>
    </div>
  )
}

function NewHelpChatButton() {
  return (
    <form action={async () => {
      'use server'
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, agent_id: 'help', title: 'Neue Anfrage' })
        .select('id')
        .single()
      if (conv) redirect(`/dashboard/help?chat=${conv.id}`)
    }}>
      <button
        type="submit"
        className="text-xs text-primary hover:text-primary-hover border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
      >
        + Neuer Chat
      </button>
    </form>
  )
}
