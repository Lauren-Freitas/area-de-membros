'use client'

import { useActionState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { updateUser } from '@/lib/actions/admin'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export default function EditarUsuarioPage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const boundAction = updateUser.bind(null, id)
  const [state, action, isPending] = useActionState(boundAction, undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-gray-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-gray-400 text-sm">
        Usuário não encontrado.{' '}
        <Link href="/admin/usuarios" className="underline" style={{ color: '#b48840' }}>
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/usuarios" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Editar usuário</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="mb-5 pb-5 border-b border-gray-100">
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <form action={action} className="space-y-5">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
            <input
              name="name"
              defaultValue={profile.name}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Função</label>
            <select
              name="role"
              defaultValue={profile.role}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <option value="membro">Membro</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <Link
              href="/admin/usuarios"
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
