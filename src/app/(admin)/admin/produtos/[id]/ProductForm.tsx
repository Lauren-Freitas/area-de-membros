'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { saveProduct } from '@/lib/actions/admin'
import { generatePaymentLink } from '@/lib/actions/asaas'
import { Product } from '@/types'

const BILLING_CYCLES: { value: string; label: string }[] = [
  { value: '', label: 'Avulso (pagamento único)' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quinzenal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'BIMONTHLY', label: 'Bimestral' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMIANNUALLY', label: 'Semestral' },
  { value: 'YEARLY', label: 'Anual' },
]

function GeneratePaymentLinkButton({ productId, buyUrlInputRef }: { productId: string; buyUrlInputRef: React.RefObject<HTMLInputElement | null> }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await generatePaymentLink(productId)
      if (result.error) {
        setError(result.error)
      } else if (result.url && buyUrlInputRef.current) {
        buyUrlInputRef.current.value = result.url
      }
    })
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
      >
        {isPending ? 'Gerando...' : 'Gerar link de pagamento no Asaas'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, isPending] = useActionState(saveProduct, undefined)
  const buyUrlInputRef = useRef<HTMLInputElement>(null)
  const [contentType, setContentType] = useState(product?.content_type ?? 'file')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const isEditing = !!product

  return (
    <form action={action} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      {/* Título + switch de ativo/inativo */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar produto' : 'Criar produto'}
        </h1>
        <label htmlFor="is_active" title="Aparece na área de membros" className="flex items-center gap-2 cursor-pointer select-none shrink-0">
          <span className="text-sm font-medium text-gray-600">{isActive ? 'Ativo' : 'Inativo'}</span>
          <span className="relative inline-block w-11 h-6">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full bg-gray-300 peer-checked:bg-emerald-500 transition-colors" />
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={product?.title}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          placeholder="Ex: Cardápio Semanal Personalizado"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          name="description"
          defaultValue={product?.description}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent resize-none"
          placeholder="Descreva brevemente o conteúdo..."
        />
      </div>

      {/* URL da imagem de capa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL da imagem de capa
          <span className="text-gray-400 font-normal ml-1 text-xs">(opcional)</span>
        </label>
        <input
          name="banner_url"
          defaultValue={product?.banner_url ?? ''}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          placeholder="https://..."
        />
      </div>

      {/* Conteúdo simples (usado quando o produto não tem módulos/aulas) */}
      <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de conteúdo
            <span className="text-gray-400 font-normal ml-1 text-xs">(só é usado se o produto não tiver módulos/aulas)</span>
          </label>
          <select
            name="content_type"
            value={contentType}
            onChange={e => setContentType(e.target.value as 'file' | 'video')}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          >
            <option value="file">Arquivo</option>
            <option value="video">Vídeo</option>
          </select>
        </div>
        {contentType === 'video' && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL do vídeo</label>
            <input
              name="content_url"
              defaultValue={product?.content_url ?? ''}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
            />
          </div>
        )}
        {contentType === 'file' && (
          <p className="text-xs text-gray-400 self-end pb-2.5">
            O arquivo é enviado direto no Storage do Supabase (bucket <code className="bg-gray-100 px-1 rounded">produtos</code>, caminho <code className="bg-gray-100 px-1 rounded">{'{id do produto}'}/arquivo</code>).
          </p>
        )}
      </div>

      {/* Preço + Ciclo de cobrança */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço (R$)
            <span className="text-gray-400 font-normal ml-1 text-xs">(usado ao gerar o link no Asaas)</span>
          </label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price ?? ''}
            className="w-40 px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
            placeholder="297.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo de cobrança</label>
          <select
            name="billing_cycle"
            defaultValue={product?.billing_cycle ?? ''}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          >
            {BILLING_CYCLES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Link de compra */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link de compra
          <span className="text-gray-400 font-normal ml-1 text-xs">(aparece na vitrine para quem ainda não tem acesso)</span>
        </label>
        <input
          name="buy_url"
          ref={buyUrlInputRef}
          defaultValue={product?.buy_url ?? ''}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          placeholder="https://www.asaas.com/c/... ou link do WhatsApp"
        />
        {isEditing && <GeneratePaymentLinkButton productId={product.id} buyUrlInputRef={buyUrlInputRef} />}
      </div>

      {/* ID do produto na Kiwify */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID do produto na Kiwify
          <span className="text-gray-400 font-normal ml-1 text-xs">(opcional — necessário só se vender esse produto pela Kiwify)</span>
        </label>
        <input
          name="kiwify_product_id"
          defaultValue={product?.kiwify_product_id ?? ''}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          placeholder="Copie em Kiwify → Produtos → abra o produto → ID na URL"
        />
      </div>

      {/* Ordem + Pack (pack só no modo edição) */}
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de exibição</label>
          <input
            name="sort_order"
            type="number"
            min="0"
            defaultValue={product?.sort_order ?? 0}
            className="w-32 px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          />
        </div>

        {isEditing && (
          <div className="flex items-center gap-3 pt-5">
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
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#b48840' }}
        >
          {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar produto'}
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
