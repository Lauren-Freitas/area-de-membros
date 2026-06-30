import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default async function ComunidadePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('community_posts')
    .select('id, title, body, pinned, created_at, profiles(name), community_replies(count)')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comunidade</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tire dúvidas, compartilhe e conecte com outros membros.</p>
        </div>
        <Link
          href="/comunidade/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#c9a84c' }}
        >
          + Publicar
        </Link>
      </div>

      {!posts?.length ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">Seja o primeiro a publicar!</p>
          <p className="text-sm mt-1">Faça uma pergunta ou compartilhe algo com a turma.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
            const replyCount = Array.isArray(post.community_replies)
              ? post.community_replies.reduce((acc: number, r: { count: number }) => acc + (r.count ?? 0), 0)
              : 0
            return (
              <Link
                key={post.id}
                href={`/comunidade/${post.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-5 py-4 hover:shadow-sm transition group"
                style={post.pinned ? { borderColor: '#f0d98c' } : {}}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: '#fdf8e6', color: '#92710a' }}
                  >
                    {initials(author?.name ?? '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {post.pinned && <span className="text-xs" title="Fixado">📌</span>}
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:underline line-clamp-1">
                        {post.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{post.body}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{author?.name ?? 'Membro'}</span>
                      <span>·</span>
                      <span>{timeAgo(post.created_at)}</span>
                      <span>·</span>
                      <span>💬 {replyCount} resposta{replyCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
