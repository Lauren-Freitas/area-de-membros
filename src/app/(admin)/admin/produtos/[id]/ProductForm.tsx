'use client'

import { useActionState } from 'react'
import { saveProduct } from '@/lib/actions/admin'
import { Product } from '@/types'

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, isPending] = useActionState(saveProduct, undefined)

  return (
    <form action={action} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            defaultValue={product?.title}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            placeholder="Ex: Cardápio Semanal Personalizado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de conteúdo <span className="text-red-500">*</span>
          </label>
          <select
            name="content_type"
            defaultValue={product?.content_type ?? 'file'}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          >
            <option value="file">Download (PDF, Excel, etc.)</option>
            <option value="video">Vídeo (YouTube ou Vimeo)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          name="description"
          defaultValue={product?.description}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
          placeholder="Descreva brevemente o conteúdo..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL do conteúdo
          <span className="text-gray-400 font-normal ml-1 text-xs">
            (para vídeos: cole o link do YouTube/Vimeo; para arquivos: deixe vazio e suba o arquivo pelo Storage)
          </span>
        </label>
        <input
          name="content_url"
          defaultValue={product?.content_url ?? ''}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL da imagem de capa
          <span className="text-gray-400 font-normal ml-1 text-xs">(opcional)</span>
        </label>
        <input
          name="banner_url"
          defaultValue={product?.banner_url ?? ''}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link de compra
          <span className="text-gray-400 font-normal ml-1 text-xs">(aparece na vitrine para quem ainda não tem acesso)</span>
        </label>
        <input
          name="buy_url"
          defaultValue={product?.buy_url ?? ''}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          placeholder="https://www.asaas.com/c/... ou link do WhatsApp"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de exibição</label>
          <input
            name="sort_order"
            type="number"
            min="0"
            defaultValue={product?.sort_order ?? 0}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3 sm:pt-6">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            defaultChecked={product?.is_active ?? true}
            className="w-4 h-4 rounded accent-emerald-600"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Produto ativo
            <p className="text-xs text-gray-400 font-normal">Aparece na área de membros</p>
          </label>
        </div>

        <div className="flex items-center gap-3 sm:pt-6">
          <input
            type="checkbox"
            name="is_pack"
            id="is_pack"
            defaultChecked={product?.is_pack ?? false}
            className="w-4 h-4 rounded accent-emerald-600"
          />
          <label htmlFor="is_pack" className="text-sm font-medium text-gray-700">
            Pack completo
            <p className="text-xs text-gray-400 font-normal">Libera acesso a tudo</p>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-400 text-white text-sm font-semibold rounded-lg transition"
        >
          {isPending ? 'Salvando...' : product ? 'Salvar alterações' : 'Criar produto'}
        </button>
        <a
          href="/admin/produtos"
          className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
