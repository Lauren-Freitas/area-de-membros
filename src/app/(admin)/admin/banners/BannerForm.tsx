'use client'
import { useActionState } from 'react'
import { saveBanner, AdminActionState } from '@/lib/actions/admin'
import { Banner } from '@/types'
import Link from 'next/link'

export function BannerForm({ banner }: { banner: Banner | null }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveBanner, undefined)

  return (
    <form action={action} className="space-y-5">
      {banner && <input type="hidden" name="id" value={banner.id} />}

      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-400">*</span></label>
        <input
          name="title"
          defaultValue={banner?.title ?? ''}
          required
          placeholder="Ex: Nova aula disponível!"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          name="body"
          defaultValue={banner?.body ?? ''}
          rows={3}
          placeholder="Texto adicional explicando o banner..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link (opcional)</label>
          <input
            name="link"
            defaultValue={banner?.link ?? ''}
            placeholder="https://..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texto do botão</label>
          <input
            name="link_label"
            defaultValue={banner?.link_label ?? 'Ver mais'}
            placeholder="Ver mais"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            name="type"
            defaultValue={banner?.type ?? 'info'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
          >
            <option value="info">Info (azul)</option>
            <option value="success">Sucesso (verde)</option>
            <option value="warning">Aviso (amarelo)</option>
            <option value="promo">Promo (dourado)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={banner?.sort_order ?? 0}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Expira em (opcional)</label>
        <input
          name="expires_at"
          type="datetime-local"
          defaultValue={banner?.expires_at ? banner.expires_at.slice(0, 16) : ''}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          defaultChecked={banner?.is_active ?? true}
          className="rounded"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Ativo (visível para os membros)</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#b48840' }}
        >
          {pending ? 'Salvando...' : banner ? 'Salvar alterações' : 'Criar banner'}
        </button>
        <Link href="/admin/banners" className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
