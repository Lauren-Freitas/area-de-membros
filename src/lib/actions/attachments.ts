'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const MAX_ATTACHMENTS = 10
const MAX_SIZE_BYTES = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['gif', 'jpg', 'jpeg', 'png', 'bmp', 'pdf', 'zip', 'rar', 'epub', 'xls', 'xlsx', 'mp3', 'doc', 'docx', 'ppt', 'pptx']
const BUCKET = 'lesson-attachments'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')
}

export async function createAttachmentUploadUrl(
  lessonId: string,
  fileName: string,
  fileSize: number
): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) return { error: `Tipo de arquivo não permitido: .${ext}` }
  if (fileSize > MAX_SIZE_BYTES) return { error: 'Arquivo maior que 100MB.' }
  if (fileSize <= 0) return { error: 'Arquivo inválido.' }

  const { count } = await admin
    .from('lesson_attachments')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)
  if ((count ?? 0) >= MAX_ATTACHMENTS) return { error: 'Limite de 10 anexos por aula atingido.' }

  const path = `${lessonId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Erro ao gerar URL de upload.' }

  return { signedUrl: data.signedUrl, token: data.token, path }
}

export async function confirmAttachment(
  lessonId: string,
  path: string,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<{ id?: string; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const { count } = await admin
    .from('lesson_attachments')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)

  const { data, error } = await admin.from('lesson_attachments').insert({
    lesson_id: lessonId,
    file_name: fileName,
    file_path: path,
    file_size: fileSize,
    mime_type: mimeType || null,
    sort_order: count ?? 0,
  }).select('id').single()
  if (error) return { error: error.message }
  return { id: data.id }
}

export async function deleteAttachment(attachmentId: string): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: attachment } = await admin
    .from('lesson_attachments')
    .select('file_path')
    .eq('id', attachmentId)
    .single()

  if (attachment) await admin.storage.from(BUCKET).remove([attachment.file_path])
  const { error } = await admin.from('lesson_attachments').delete().eq('id', attachmentId)
  if (error) return { error: error.message }
  return {}
}

export async function getAttachmentDownloadUrl(attachmentId: string): Promise<{ url?: string; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: attachment } = await admin
    .from('lesson_attachments')
    .select('file_path, file_name')
    .eq('id', attachmentId)
    .single()
  if (!attachment) return { error: 'Anexo não encontrado.' }

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(attachment.file_path, 3600, { download: attachment.file_name })
  if (error || !data) return { error: error?.message ?? 'Erro ao gerar link.' }
  return { url: data.signedUrl }
}
