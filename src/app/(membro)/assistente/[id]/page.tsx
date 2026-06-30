import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from './ChatInterface'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: conversation }, { data: messages }] = await Promise.all([
    supabase.from('ai_conversations').select('id, title').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('ai_messages').select('id, role, content, created_at').eq('conversation_id', id).order('created_at'),
  ])

  if (!conversation) redirect('/assistente')

  return (
    <ChatInterface
      conversationId={id}
      initialMessages={messages ?? []}
      title={conversation.title ?? 'Nova conversa'}
    />
  )
}
