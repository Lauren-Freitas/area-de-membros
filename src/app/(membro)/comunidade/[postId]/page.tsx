import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deletePost, pinPost, deleteReply } from '@/lib/actions/community'
import { ReplyForm } from './ReplyForm'

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
    supabase.from('community_posts').select('*, profiles(name)').eq('id', postId).single(),
    supabase.from('community_replies').select('*, profiles(name)').eq('post_id', postId).order('created_at'),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (!post) redirect('/comunidade')

  const isAdmin = profile?.role === 'admin'
  const postAuthor = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4"
        style={post.pinned ? { borderColor: '#f0d98c' } : {}}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: '#fdf8e6', color: '#92710a' }}>
              {initials(postAuthor?.name ?? '?')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {post.pinned && <span className="text-sm">📌</span>}
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{post.title}</h1>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{postAuthor?.name} · {timeAgo(post.created_at)}</p>
            </div>
          </div>

          {/* Ações admin/autor */}
          {(isAdmin || isMyPost) && (
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <form action={async () => { 'use server'; await pinPost(postId, !post.pinned) }}>
                  <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                    {post.pinned ? 'Desafixar' : '📌 Fixar'}
                  </button>
                </form>
              )}
              <form action={async () => { 'use server'; await deletePost(postId) }}>
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                  Excluir
                </button>
              </form>
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
          const author = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles
          const isMyReply = reply.user_id === user.id
          return (
            <div key={reply.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                  {initials(author?.name ?? '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {author?.name} <span className="font-normal text-gray-400">· {timeAgo(reply.created_at)}</span>
                    </p>
                    {(isAdmin || isMyReply) && (
                      <form action={async () => { 'use server'; await deleteReply(reply.id, postId) }}>
                        <button type="submit" className="text-[10px] text-red-400 hover:text-red-600 transition">
                          Excluir
                        </button>
                      </form>
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
