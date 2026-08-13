'use client'

import { useActionState, useState } from 'react'
import { saveModule } from '@/lib/actions/admin'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Module } from '@/types'

interface Props { productId: string; module?: Module }

export function ModuloForm({ productId, module }: Props) {
  const [state, action, isPending] = useActionState(saveModule, undefined)
  const [releaseType, setReleaseType] = useState<string>(module?.release_type ?? 'immediate')

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="product_id" value={productId} />
      {module && <input type="hidden" name="id" value={module.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
        <Input
          name="title"
          defaultValue={module?.title}
          required
          placeholder="Ex: Módulo 1 — Fundamentos"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
        <Textarea
          name="description"
          defaultValue={module?.description ?? ''}
          rows={2}
          placeholder="Descreva brevemente o que o aluno vai aprender..."
        />
      </div>

      {/* Liberação */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quando liberar este módulo?</label>
        <div className="flex flex-col gap-2">
          {/* Imediatamente */}
          <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition has-[:checked]:border-[var(--brand)] has-[:checked]:bg-amber-50 border-gray-200">
            <input
              type="radio"
              name="release_type"
              value="immediate"
              checked={releaseType === 'immediate'}
              onChange={() => setReleaseType('immediate')}
              className="accent-[var(--brand)]"
            />
            <div>
              <p className="text-sm font-medium text-gray-800" style={releaseType === 'immediate' ? { color: 'var(--brand-text)' } : undefined}>Imediatamente</p>
              <p className="text-xs text-gray-400" style={releaseType === 'immediate' ? { color: '#9a7230' } : undefined}>Disponível assim que o aluno tiver acesso ao produto</p>
            </div>
          </label>

          {/* Após X dias */}
          <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition has-[:checked]:border-[var(--brand)] has-[:checked]:bg-amber-50 border-gray-200">
            <input
              type="radio"
              name="release_type"
              value="days_after"
              checked={releaseType === 'days_after'}
              onChange={() => setReleaseType('days_after')}
              className="accent-[var(--brand)] mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800" style={releaseType === 'days_after' ? { color: 'var(--brand-text)' } : undefined}>Após X dias do acesso</p>
              <p className="text-xs text-gray-400 mb-2" style={releaseType === 'days_after' ? { color: '#9a7230' } : undefined}>Libera automaticamente N dias após o aluno ganhar acesso ao produto</p>
              {releaseType === 'days_after' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="release_after_days"
                    min="1"
                    defaultValue={module?.release_after_days ?? 7}
                    className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                  <span className="text-sm text-gray-500">dias</span>
                </div>
              )}
            </div>
          </label>

          {/* Data específica */}
          <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition has-[:checked]:border-[var(--brand)] has-[:checked]:bg-amber-50 border-gray-200">
            <input
              type="radio"
              name="release_type"
              value="date"
              checked={releaseType === 'date'}
              onChange={() => setReleaseType('date')}
              className="accent-[var(--brand)] mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800" style={releaseType === 'date' ? { color: 'var(--brand-text)' } : undefined}>Em data específica</p>
              <p className="text-xs text-gray-400 mb-2" style={releaseType === 'date' ? { color: '#9a7230' } : undefined}>Libera para todos na data e hora escolhidas</p>
              {releaseType === 'date' && (
                <input
                  type="datetime-local"
                  name="release_at"
                  defaultValue={module?.release_at ? module.release_at.slice(0, 16) : ''}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
                />
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : module ? 'Salvar alterações' : 'Criar módulo'}
        </Button>
        <Button variant="secondary" href={`/admin/produtos/${productId}`}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
