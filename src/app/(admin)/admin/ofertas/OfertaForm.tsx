'use client'
import { useActionState, useState } from 'react'
import { saveOffer } from '@/lib/actions/offers'
import { Switch } from '@/components/admin/Switch'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Select } from '@/components/Select'

interface Product { id: string; title: string }
interface Offer {
  id: string; product_id: string | null; title: string; description: string | null
  original_price: number | null; promo_price: number | null; coupon_code: string | null
  ends_at: string | null; sort_order: number; is_active: boolean
}

export function OfertaForm({ offer, products }: { offer?: Offer; products: Product[] }) {
  const [isActive, setIsActive] = useState(offer?.is_active ?? true)
  const [state, action, isPending] = useActionState(saveOffer, {})

  return (
    <form action={action} className="space-y-5 bg-card rounded-2xl border border-gray-100 p-6 max-w-lg">
      {offer && <input type="hidden" name="id" value={offer.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Título da oferta *</label>
        <Input
          name="title"
          required
          defaultValue={offer?.title}
          placeholder="Ex: Oferta relâmpago, 50% off!"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
        <Textarea
          name="description"
          rows={2}
          defaultValue={offer?.description ?? ''}
          placeholder="Detalhe a oferta para o membro..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Produto relacionado</label>
        <Select
          name="product_id"
          defaultValue={offer?.product_id ?? ''}
        >
          <option value="">Nenhum (oferta geral)</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço original (R$)</label>
          <Input
            type="number"
            name="original_price"
            step="0.01"
            defaultValue={offer?.original_price ?? ''}
            placeholder="197,00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço promocional (R$)</label>
          <Input
            type="number"
            name="promo_price"
            step="0.01"
            defaultValue={offer?.promo_price ?? ''}
            placeholder="97,00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cupom de desconto</label>
        <Input
          name="coupon_code"
          defaultValue={offer?.coupon_code ?? ''}
          placeholder="EX: PROMO50"
          className="font-mono"
        />
        <p className="text-xs text-gray-400 mt-1">Opcional. O membro pode copiar e usar no checkout.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Encerra em</label>
          <Input
            type="datetime-local"
            name="ends_at"
            defaultValue={offer?.ends_at ? offer.ends_at.slice(0, 16) : ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordem</label>
          <Input
            type="number"
            name="sort_order"
            defaultValue={offer?.sort_order ?? 0}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch name="is_active" checked={isActive} onChange={setIsActive} title="Aparece na área de membros" />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : offer ? 'Salvar alterações' : 'Criar oferta'}
        </Button>
        <Button variant="secondary" href="/admin/ofertas">Cancelar</Button>
      </div>
    </form>
  )
}
