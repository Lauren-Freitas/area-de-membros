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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assistente IA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tire suas dúvidas sobre nutrição com ajuda da inteligência artificial.</p>
        </div>
        <NewConversationButton userId={user.id} />
      </div>

      {!conversations?.length ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
          <p className="text-5xl mb-4">🤖</p>
          <p className="font-medium text-gray-600 dark:text-gray-300">Converse com o Assistente de Nutrição</p>
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
              className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-sm transition group"
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
