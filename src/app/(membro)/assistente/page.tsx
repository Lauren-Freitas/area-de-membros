import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NewConversationButton } from './NewConversationButton'

export default async function AssistentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proteíno</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tire suas dúvidas sobre nutrição com ajuda da inteligência artificial.</p>
        </div>
        <NewConversationButton userId={user.id} />
      </div>

      {!conversations?.length ? (
        <div className="text-center py-20 bg-white dark:bg-[#0d1020] rounded-2xl border border-dashed border-gray-200 dark:border-[#1e2030] text-gray-400">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16" style={{ color: '#b48840' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V5" />
              <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5h15A1.5 1.5 0 0121 6.5v10A1.5 1.5 0 0119.5 18h-15A1.5 1.5 0 013 16.5v-10A1.5 1.5 0 014.5 5z" />
              <rect x="7.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.4} />
              <rect x="13.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.4} />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.5h6" />
              <path strokeLinecap="round" d="M3 11H1.5M22.5 11H21" />
            </svg>
          </div>
          <p className="font-medium text-gray-600 dark:text-gray-300">Converse com o Proteíno</p>
          <p className="text-sm mt-2 max-w-xs mx-auto">Tire dúvidas sobre alimentos, dietas, receitas e hábitos saudáveis — a qualquer hora.</p>
          <div className="mt-6">
            <NewConversationButton userId={user.id} primary />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/assistente/${conv.id}`}
              className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-[#0d1020] rounded-xl border border-gray-100 dark:border-[#1e2030] hover:shadow-sm transition group"
            >
              <span className="text-xl shrink-0">💬</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline truncate">
                  {conv.title ?? 'Nova conversa'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(conv.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
