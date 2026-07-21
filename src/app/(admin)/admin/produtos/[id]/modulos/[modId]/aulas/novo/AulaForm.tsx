'use client'

import { useActionState, useState } from 'react'
import { saveLesson } from '@/lib/actions/admin'
import Link from 'next/link'
import { Lesson, LessonAttachment } from '@/types'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { AttachmentsManager } from '@/components/admin/AttachmentsManager'
import { Switch } from '@/components/admin/Switch'

interface Props { productId: string; moduleId: string; lesson?: Lesson; attachments?: LessonAttachment[] }

export function AulaForm({ productId, moduleId, lesson, attachments }: Props) {
  const [state, action, isPending] = useActionState(saveLesson, undefined)
  const [releaseType, setReleaseType] = useState<string>(lesson?.release_type ?? 'immediate')
  const [isPublished, setIsPublished] = useState(lesson?.is_published ?? true)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="product_id" value={productId} />
      {lesson && <input type="hidden" name="id" value={lesson.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
        <input
          name="title"
          defaultValue={lesson?.title}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          placeholder="Ex: Aula 1 — Introdução"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
        <textarea
          name="description"
          defaultValue={lesson?.description ?? ''}
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
        />
      </div>

      {/* Vídeo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vídeo <span className="text-gray-400 font-normal text-xs">(opcional — YouTube ou Vimeo)</span>
        </label>
        <input
          name="content_url"
          defaultValue={lesson?.content_url ?? ''}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      {/* Texto rico */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Conteúdo em texto <span className="text-gray-400 font-normal text-xs">(opcional)</span>
        </label>
        <RichTextEditor name="content_html" defaultValue={lesson?.content_html} />
      </div>

      {/* Anexos */}
      {lesson ? (
        <AttachmentsManager lessonId={lesson.id} initialAttachments={attachments ?? []} />
      ) : (
        <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-400">
          Salve a aula primeiro para poder adicionar anexos.
        </div>
      )}

      {/* Liberação */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quando liberar esta aula?</label>
        <div className="flex flex-col gap-2">
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
              <p className="text-sm font-medium text-gray-800">Imediatamente</p>
              <p className="text-xs text-gray-400">Disponível assim que o aluno tiver acesso ao produto</p>
            </div>
          </label>

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
              <p className="text-sm font-medium text-gray-800">Após X dias do acesso</p>
              <p className="text-xs text-gray-400 mb-2">Libera automaticamente N dias após o aluno ganhar acesso ao produto</p>
              {releaseType === 'days_after' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="release_after_days"
                    min="1"
                    defaultValue={lesson?.release_after_days ?? 7}
                    className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                  <span className="text-sm text-gray-500">dias</span>
                </div>
              )}
            </div>
          </label>

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
              <p className="text-sm font-medium text-gray-800">Em data específica</p>
              <p className="text-xs text-gray-400 mb-2">Libera para todos na data e hora escolhidas</p>
              {releaseType === 'date' && (
                <input
                  type="datetime-local"
                  name="release_at"
                  defaultValue={lesson?.release_at ? lesson.release_at.slice(0, 16) : ''}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Limite de duração */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Limitar duração do conteúdo <span className="text-gray-400 font-normal text-xs">(opcional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="access_duration_days"
            min="1"
            defaultValue={lesson?.access_duration_days ?? ''}
            className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
            placeholder="—"
          />
          <span className="text-sm text-gray-500">dias após a liberação (deixe em branco para acesso sem prazo)</span>
        </div>
      </div>

      <div className="pt-1">
        <Switch name="is_published" checked={isPublished} onChange={setIsPublished} label="Publicada" activeLabel="Sim" inactiveLabel="Não" />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {isPending ? 'Salvando...' : lesson ? 'Salvar alterações' : 'Criar aula'}
        </button>
        <Link href={`/admin/produtos/${productId}/modulos/${moduleId}`} className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
