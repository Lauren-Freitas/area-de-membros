import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createPost } from '@/lib/actions/community'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/Button'

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

      <form action={createPost} className="space-y-4 bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
          <Input
            name="title"
            required
            maxLength={120}
            placeholder="Ex: Como adaptar a dieta nos fins de semana?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensagem *</label>
          <Textarea
            name="body"
            required
            rows={6}
            placeholder="Conte mais sobre sua dúvida ou experiência..."
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit">
            Publicar
          </Button>
          <Button href="/comunidade" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
