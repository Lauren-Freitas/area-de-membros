import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deletePost, pinPost, deleteReply } from '@/lib/actions/community'
import { ReplyForm } from './ReplyForm'
import { DeleteConfirmButton } from '@/components/DeleteConfirmButton'
import { Button } from '@/components/Button'

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

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: post }, { data: replies }, { data: profile }] = await Promise.all([
    supabase.from('community_posts').select('*').eq('id', postId).single(),
    supabase.from('community_replies').select('*').eq('post_id', postId).order('created_at'),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (!post) redirect('/comunidade')

  // Autoria pra terceiros: RLS de profiles só permite ler a própria linha, então
  // um embed profiles(name) direto resolveria null pro autor do post/respostas
  // de qualquer outra pessoa. get_profile_names (SECURITY DEFINER, só id+name --
  // Etapa 8) resolve isso sem abrir SELECT amplo na tabela.
  const authorIds = [...new Set([post.user_id, ...(replies ?? []).map(r => r.user_id)])]
  const authorsResult = authorIds.length
    ? await supabase.rpc('get_profile_names', { profile_ids: authorIds })
    : { data: [] }
  const authors = (authorsResult.data ?? []) as { id: string; name: string }[]
  const nameByAuthorId = new Map(authors.map(a => [a.id, a.name]))

  const isAdmin = profile?.role === 'admin' || profile?.role === 'equipe'
  const postAuthorName = nameByAuthorId.get(post.user_id)
  const isMyPost = post.user_id === user.id

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/comunidade" className="hover:text-gray-800 dark:hover:text-gray-200 transition">Comunidade</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium line-clamp-1">{post.title}</span>
      </div>

      {/* Post principal */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6 space-y-4"
        style={post.pinned ? { borderColor: 'var(--brand-border)' } : {}}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}>
              {initials(postAuthorName ?? '?')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {post.pinned && <span className="text-sm">📌</span>}
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{post.title}</h1>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{postAuthorName ?? 'Membro'} · {timeAgo(post.created_at)}</p>
            </div>
          </div>

          {/* Ações admin/autor */}
          {(isAdmin || isMyPost) && (
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <form action={async () => { 'use server'; await pinPost(postId, !post.pinned) }}>
                  <Button type="submit" variant="secondary" size="sm">
                    {post.pinned ? 'Desafixar' : '📌 Fixar'}
                  </Button>
                </form>
              )}
              <DeleteConfirmButton
                onDelete={async () => { 'use server'; await deletePost(postId) }}
                title="Excluir publicação"
                message="Essa publicação e todas as respostas serão excluídas permanentemente."
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
              />
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{post.body}</p>
      </div>

      {/* Respostas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {replies?.length ?? 0} resposta{replies?.length !== 1 ? 's' : ''}
        </h2>

        {replies?.map((reply) => {
          const replyAuthorName = nameByAuthorId.get(reply.user_id)
          const isMyReply = reply.user_id === user.id
          return (
            <div key={reply.id} className="bg-card rounded-xl border border-gray-100 dark:border-[#1e2030] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}>
                  {initials(replyAuthorName ?? '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {replyAuthorName ?? 'Membro'} <span className="font-normal text-gray-400">· {timeAgo(reply.created_at)}</span>
                    </p>
                    {(isAdmin || isMyReply) && (
                      <DeleteConfirmButton
                        onDelete={async () => { 'use server'; await deleteReply(reply.id, postId) }}
                        title="Excluir resposta"
                        message="Essa resposta será excluída permanentemente."
                        className="text-[10px] text-red-400 hover:text-red-600 transition"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{reply.body}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Formulário de resposta */}
      <ReplyForm postId={postId} />
    </div>
  )
}
