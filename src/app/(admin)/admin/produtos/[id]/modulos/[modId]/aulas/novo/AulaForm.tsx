'use client'

import { useActionState, useState } from 'react'
import { saveLesson } from '@/lib/actions/admin'
import Link from 'next/link'
import { Lesson } from '@/types'

interface Props { productId: string; moduleId: string; lesson?: Lesson }

export function AulaForm({ productId, moduleId, lesson }: Props) {
  const [state, action, isPending] = useActionState(saveLesson, undefined)
  const [type, setType] = useState(lesson?.lesson_type ?? 'video')

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de aula <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'video', icon: '▶', label: 'Vídeo' },
            { value: 'text', icon: '📝', label: 'Texto' },
            { value: 'file', icon: '📄', label: 'Arquivo' },
            { value: 'link', icon: '🔗', label: 'Link' },
          ].map(({ value, icon, label }) => (
            <label
              key={value}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition text-sm font-medium ${
                type === value ? 'border-gold-400 bg-gold-50 text-gray-900' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="lesson_type"
                value={value}
                checked={type === value}
                onChange={() => setType(value as 'video' | 'text' | 'file' | 'link')}
                className="sr-only"
              />
              <span className="text-xl">{icon}</span>
              {label}
            </label>
          ))}
        </div>
      </div>

      {(type === 'video' || type === 'file' || type === 'link') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'video' ? 'URL do vídeo (YouTube ou Vimeo)' : type === 'file' ? 'URL do arquivo' : 'URL do link externo'}
          </label>
          <input
            name="content_url"
            defaultValue={lesson?.content_url ?? ''}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            placeholder={
              type === 'video' ? 'https://youtube.com/watch?v=...' :
              type === 'file' ? 'https://...' :
              'https://wa.me/55... ou https://...'
            }
          />
        </div>
      )}

      {type === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo da aula</label>
          <textarea
            name="content_text"
            defaultValue={lesson?.content_text ?? ''}
            rows={10}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-y font-mono"
            placeholder="Escreva o conteúdo da aula aqui..."
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
          <input
            name="sort_order"
            type="number"
            min="0"
            defaultValue={lesson?.sort_order ?? 0}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={lesson?.is_published ?? true}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#b48840' }}
            />
            <span className="text-sm font-medium text-gray-700">Publicada</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#b48840' }}
        >
          {isPending ? 'Salvando...' : lesson ? 'Salvar alterações' : 'Criar aula'}
        </button>
        <Link href={`/admin/produtos/${productId}/modulos/${moduleId}`} className="text-sm text-gray-500 hover:text-gray-800">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
