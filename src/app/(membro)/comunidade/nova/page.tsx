import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createPost } from '@/lib/actions/community'

export default async function NovaPublicacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/comunidade" className="hover:text-gray-800 dark:hover:text-gray-200 transition">Comunidade</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Nova publicação</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nova publicação</h1>

      <form action={createPost} className="space-y-4 bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Ex: Como adaptar a dieta nos fins de semana?"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensagem *</label>
          <textarea
            name="body"
            required
            rows={6}
            placeholder="Conte mais sobre sua dúvida ou experiência..."
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#b48840' }}
          >
            Publicar
          </button>
          <Link href="/comunidade" className="px-5 py-2 text-sm font-medium text-gray-500 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
