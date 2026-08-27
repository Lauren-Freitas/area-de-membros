'use client'

import { useActionState, useState } from 'react'
import { saveLesson } from '@/lib/actions/admin'
import { Button } from '@/components/Button'
import { Lesson, LessonAttachment } from '@/types'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { AttachmentsManager } from '@/components/admin/AttachmentsManager'
import { ClassificationFields } from '@/components/admin/ClassificationFields'
import { Switch } from '@/components/admin/Switch'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Territory, SkillTrack, ContentFormat } from '@/types'

interface Props {
  productId: string
  moduleId: string
  lesson?: Lesson
  attachments?: LessonAttachment[]
  territories: Territory[]
  skillTracks: SkillTrack[]
  contentFormats: ContentFormat[]
  selectedSkillTrackIds?: string[]
}

export function AulaForm({ productId, moduleId, lesson, attachments, territories, skillTracks, contentFormats, selectedSkillTrackIds }: Props) {
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
        <Input
          name="title"
          defaultValue={lesson?.title}
          required
          placeholder="Ex: Aula 1: Introdução"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
        <Textarea
          name="description"
          defaultValue={lesson?.description ?? ''}
          rows={2}
        />
      </div>

      {/* Vídeo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vídeo <span className="text-gray-400 font-normal text-xs">(opcional: YouTube ou Vimeo)</span>
        </label>
        <Input
          name="content_url"
          defaultValue={lesson?.content_url ?? ''}
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

      {/* Classificação (território, trilhas, tipo de conteúdo) */}
      <ClassificationFields
        territories={territories}
        skillTracks={skillTracks}
        contentFormats={contentFormats}
        defaultTerritoryId={lesson?.territory_id}
        defaultContentFormatId={lesson?.content_format_id}
        defaultSkillTrackIds={selectedSkillTrackIds}
      />

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
              <p className="text-sm font-medium text-gray-800" style={releaseType === 'immediate' ? { color: 'var(--brand-text)' } : undefined}>Imediatamente</p>
              <p className="text-xs text-gray-400" style={releaseType === 'immediate' ? { color: '#9a7230' } : undefined}>Disponível assim que o aluno tiver acesso ao produto</p>
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
              <p className="text-sm font-medium text-gray-800" style={releaseType === 'days_after' ? { color: 'var(--brand-text)' } : undefined}>Após X dias do acesso</p>
              <p className="text-xs text-gray-400 mb-2" style={releaseType === 'days_after' ? { color: '#9a7230' } : undefined}>Libera automaticamente N dias após o aluno ganhar acesso ao produto</p>
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
              <p className="text-sm font-medium text-gray-800" style={releaseType === 'date' ? { color: 'var(--brand-text)' } : undefined}>Em data específica</p>
              <p className="text-xs text-gray-400 mb-2" style={releaseType === 'date' ? { color: '#9a7230' } : undefined}>Libera para todos na data e hora escolhidas</p>
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
            placeholder="Sem limite"
          />
          <span className="text-sm text-gray-500">dias após a liberação (deixe em branco para acesso sem prazo)</span>
        </div>
      </div>

      <div className="pt-1">
        <Switch name="is_published" checked={isPublished} onChange={setIsPublished} label="Publicada" activeLabel="Sim" inactiveLabel="Não" />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : lesson ? 'Salvar alterações' : 'Criar aula'}
        </Button>
        <Button variant="secondary" href={`/admin/produtos/${productId}/modulos/${moduleId}`}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
