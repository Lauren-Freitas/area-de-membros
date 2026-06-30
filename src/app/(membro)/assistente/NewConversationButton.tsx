'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

export function NewConversationButton({ userId, primary }: { userId: string; primary?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title: null })
        .select('id')
        .single()
      if (data?.id) router.push(`/assistente/${data.id}`)
    })
  }

  if (primary) {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#b48840' }}
      >
        {pending ? 'Criando...' : '✨ Iniciar conversa'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: '#b48840' }}
    >
      {pending ? '...' : '+ Nova'}
    </button>
  )
}
