'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAttachmentUploadUrl, confirmAttachment, deleteAttachment, getAttachmentDownloadUrl } from '@/lib/actions/attachments'
import { LessonAttachment } from '@/types'

const MAX_ATTACHMENTS = 10
const MAX_SIZE_BYTES = 100 * 1024 * 1024
const ACCEPT = '.gif,.jpg,.jpeg,.png,.bmp,.pdf,.zip,.rar,.epub,.xls,.xlsx,.mp3,.doc,.docx,.ppt,.pptx'

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface UploadingFile {
  key: string
  name: string
  progress: 'uploading' | 'error'
  error?: string
}

export function AttachmentsManager({ lessonId, initialAttachments }: { lessonId: string; initialAttachments: LessonAttachment[] }) {
  const [attachments, setAttachments] = useState<LessonAttachment[]>(initialAttachments)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setListError(null)

    const remainingSlots = MAX_ATTACHMENTS - attachments.length - uploading.length
    if (files.length > remainingSlots) {
      setListError(`Só é possível adicionar mais ${remainingSlots} anexo(s) (limite de ${MAX_ATTACHMENTS} por aula).`)
      return
    }

    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE_BYTES) {
        setListError(`"${file.name}" tem mais de 100MB e não foi enviado.`)
        continue
      }
      uploadFile(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadFile(file: File) {
    const key = `${Date.now()}-${file.name}`
    setUploading(prev => [...prev, { key, name: file.name, progress: 'uploading' }])

    try {
      const result = await createAttachmentUploadUrl(lessonId, file.name, file.size)
      if (result.error || !result.signedUrl || !result.token || !result.path) {
        throw new Error(result.error ?? 'Erro ao preparar upload.')
      }

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('lesson-attachments')
        .uploadToSignedUrl(result.path, result.token, file)
      if (uploadError) throw new Error(uploadError.message)

      const confirmResult = await confirmAttachment(lessonId, result.path, file.name, file.size, file.type)
      if (confirmResult.error || !confirmResult.id) throw new Error(confirmResult.error ?? 'Erro ao confirmar anexo.')

      setAttachments(prev => [
        ...prev,
        {
          id: confirmResult.id!,
          lesson_id: lessonId,
          file_name: file.name,
          file_path: result.path!,
          file_size: file.size,
          mime_type: file.type || null,
          sort_order: prev.length,
          created_at: new Date().toISOString(),
        },
      ])
      setUploading(prev => prev.filter(u => u.key !== key))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar arquivo.'
      setUploading(prev => prev.map(u => (u.key === key ? { ...u, progress: 'error', error: message } : u)))
    }
  }

  async function handleDelete(attachmentId: string) {
    const previous = attachments
    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    const result = await deleteAttachment(attachmentId)
    if (result.error) {
      setAttachments(previous)
      setListError(result.error)
    }
  }

  async function handleDownload(attachmentId: string) {
    const result = await getAttachmentDownloadUrl(attachmentId)
    if (result.url) window.open(result.url, '_blank')
    else setListError(result.error ?? 'Erro ao gerar link de download.')
  }

  const totalCount = attachments.length + uploading.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Anexos
          <span className="text-gray-400 font-normal ml-1 text-xs">
            (até {MAX_ATTACHMENTS}, 100MB cada — {totalCount}/{MAX_ATTACHMENTS})
          </span>
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={totalCount >= MAX_ATTACHMENTS}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Adicionar anexo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {listError && <p className="text-xs text-red-600">{listError}</p>}

      {(attachments.length > 0 || uploading.length > 0) && (
        <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
          {attachments.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1 min-w-0 truncate text-gray-700">{a.file_name}</span>
              <span className="text-xs text-gray-400 shrink-0">{formatSize(a.file_size)}</span>
              <button type="button" onClick={() => handleDownload(a.id)} className="text-xs font-medium text-gray-500 hover:text-gray-800 shrink-0">
                Baixar
              </button>
              <button type="button" onClick={() => handleDelete(a.id)} className="text-xs font-medium text-red-400 hover:text-red-600 shrink-0">
                Excluir
              </button>
            </div>
          ))}
          {uploading.map(u => (
            <div key={u.key} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1 min-w-0 truncate text-gray-500">{u.name}</span>
              {u.progress === 'uploading' ? (
                <span className="text-xs text-gray-400 shrink-0">Enviando...</span>
              ) : (
                <span className="text-xs text-red-600 shrink-0">{u.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
