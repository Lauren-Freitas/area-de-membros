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
            {/* antenna */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V5" />
            <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
            {/* head */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5h15A1.5 1.5 0 0121 6.5v10A1.5 1.5 0 0119.5 18h-15A1.5 1.5 0 013 16.5v-10A1.5 1.5 0 014.5 5z" />
            {/* eyes */}
            <rect x="7.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.8} />
            <rect x="13.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.8} />
            {/* mouth */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.5h6" />
            {/* ears */}
            <path strokeLinecap="round" d="M3 11H1.5M22.5 11H21" />
          </svg>
        )}
      </button>
    </div>
  )
}
