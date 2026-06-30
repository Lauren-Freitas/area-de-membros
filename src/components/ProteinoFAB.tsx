'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ProteinoFAB({ userId }: { userId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [hover, setHover] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title: null })
        .select('id')
        .single()
      if (data?.id) router.push(`/assistente/${data.id}`)
      else router.push('/assistente')
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {hover && !pending && (
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg pointer-events-none whitespace-nowrap"
          style={{ backgroundColor: '#7a5c10' }}
        >
          Proteíno
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={pending}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Abrir Proteíno"
        className="w-12 h-12 rounded-full text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-70"
        style={{ backgroundColor: '#b48840' }}
      >
        {pending ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        )}
      </button>
    </div>
  )
}
