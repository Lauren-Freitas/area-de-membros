import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/log-activity'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import type { Actor } from './actor'

const ATTACHMENTS_BUCKET = 'lesson-attachments'

/**
 * Copia o arquivo físico no Storage (não só a linha do banco) — se
 * compartilhasse o mesmo `file_path` entre original e cópia, excluir um
 * anexo de um lado apagaria o arquivo do outro (deleteAttachment remove do
 * Storage). Falha silenciosa por anexo: um arquivo corrompido/ausente não
 * deve travar a duplicação inteira do produto.
 */
async function copyLessonAttachments(admin: ReturnType<typeof createAdminClient>, oldLessonId: string, newLessonId: string) {
  const { data: attachments } = await admin
    .from('lesson_attachments')
    .select('*')
    .eq('lesson_id', oldLessonId)
    .order('sort_order')

  for (const att of attachments ?? []) {
    const ext = att.file_path.split('.').pop() ?? 'bin'
    const newPath = `${newLessonId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
    const { error: copyError } = await admin.storage.from(ATTACHMENTS_BUCKET).copy(att.file_path, newPath)
    if (copyError) continue

    await admin.from('lesson_attachments').insert({
      lesson_id: newLessonId,
      file_name: att.file_name,
      file_path: newPath,
      file_size: att.file_size,
      mime_type: att.mime_type,
      sort_order: att.sort_order,
    })
  }
}

export interface ProductPayload {
  title: string
  description?: string | null
  banner_url?: string | null
  buy_url?: string | null
  price?: number | null
  billing_cycle?: string | null
  content_type?: string
  content_url?: string | null
  kiwify_product_id?: string | null
  is_pack?: boolean
  sort_order?: number
  is_active?: boolean
  is_featured?: boolean
}

async function unfeatureOthers(admin: ReturnType<typeof createAdminClient>, exceptId: string) {
  await admin.from('products').update({ is_featured: false }).eq('is_featured', true).neq('id', exceptId)
}

export async function createProduct(payload: ProductPayload, actor: Actor): Promise<{ data?: Record<string, unknown>; error?: string }> {
  if (!payload.title?.trim()) return { error: 'O título é obrigatório.' }
  const admin = createAdminClient()

  const insertPayload = {
    title: payload.title.trim(),
    description: payload.description ?? '',
    banner_url: payload.banner_url ?? null,
    buy_url: payload.buy_url ?? null,
    price: payload.price ?? null,
    billing_cycle: payload.billing_cycle ?? null,
    content_type: payload.content_type ?? 'file',
    content_url: payload.content_url ?? null,
    kiwify_product_id: payload.kiwify_product_id ?? null,
    is_pack: payload.is_pack ?? false,
    sort_order: payload.sort_order ?? 0,
    is_active: payload.is_active ?? true,
    is_featured: payload.is_featured ?? false,
  }

  const { data, error } = await admin.from('products').insert(insertPayload).select().single()
  if (error) return { error: error.message }
  if (insertPayload.is_featured) await unfeatureOthers(admin, data.id)

  await logActivity({ action: 'criar', entity: 'produto', entityId: data.id, entityName: data.title, actor })
  await fireOutboundWebhooks('product.created', { product: { id: data.id, title: data.title }, actor }, data.id)
  return { data }
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>, actor: Actor): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const admin = createAdminClient()
  const update: Record<string, unknown> = {}
  if (typeof payload.title === 'string') update.title = payload.title.trim()
  if (typeof payload.description === 'string') update.description = payload.description
  if (typeof payload.banner_url === 'string' || payload.banner_url === null) update.banner_url = payload.banner_url
  if (typeof payload.buy_url === 'string' || payload.buy_url === null) update.buy_url = payload.buy_url
  if (typeof payload.price === 'number' || payload.price === null) update.price = payload.price
  if (typeof payload.billing_cycle === 'string' || payload.billing_cycle === null) update.billing_cycle = payload.billing_cycle
  if (typeof payload.content_type === 'string') update.content_type = payload.content_type
  if (typeof payload.content_url === 'string' || payload.content_url === null) update.content_url = payload.content_url
  if (typeof payload.kiwify_product_id === 'string' || payload.kiwify_product_id === null) update.kiwify_product_id = payload.kiwify_product_id
  if (typeof payload.is_pack === 'boolean') update.is_pack = payload.is_pack
  if (typeof payload.sort_order === 'number') update.sort_order = payload.sort_order
  if (typeof payload.is_active === 'boolean') update.is_active = payload.is_active
  if (typeof payload.is_featured === 'boolean') update.is_featured = payload.is_featured

  if (Object.keys(update).length === 0) return { error: 'Nenhum campo para atualizar.' }

  const { data, error } = await admin.from('products').update(update).eq('id', id).select().maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'Produto não encontrado.' }
  if (update.is_featured) await unfeatureOthers(admin, id)

  await logActivity({ action: 'editar', entity: 'produto', entityId: id, entityName: data.title, actor })
  await fireOutboundWebhooks('product.updated', { product: { id: data.id, title: data.title }, actor }, data.id)
  return { data }
}

export async function deleteProduct(id: string, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: product } = await admin.from('products').select('title').eq('id', id).maybeSingle()
  const { error } = await admin.from('products').delete().eq('id', id)
  if (error) return { error: error.message }

  await logActivity({ action: 'excluir', entity: 'produto', entityId: id, entityName: product?.title ?? null, actor })
  await fireOutboundWebhooks('product.deleted', { product: { id, title: product?.title }, actor }, id)
  return { success: true }
}

export async function toggleProductActive(id: string, currentlyActive: boolean, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: product } = await admin.from('products').select('title').eq('id', id).single()
  const { error } = await admin.from('products').update({ is_active: !currentlyActive }).eq('id', id)
  if (error) return { error: error.message }

  await logActivity({ action: currentlyActive ? 'desativar' : 'ativar', entity: 'produto', entityId: id, entityName: product?.title ?? null, actor })
  await fireOutboundWebhooks('product.updated', { product: { id, title: product?.title }, actor }, id)
  return { success: true }
}

/**
 * Reordenação em massa (drag-and-drop) — orderedIds já vem na ordem final
 * desejada, cada índice vira o novo sort_order. Updates paralelos em vez de
 * upsert: upsert com payload parcial arriscaria falhar NOT NULL de colunas
 * obrigatórias (title, content_type) que não fazem parte desta operação.
 * Não dispara webhook — reordenação é detalhe de exibição, não um evento de
 * negócio que consumidores externos precisariam saber.
 */
export async function reorderProducts(orderedIds: string[], actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const results = await Promise.all(
    orderedIds.map((id, index) => admin.from('products').update({ sort_order: index }).eq('id', id)),
  )
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  await logActivity({ action: 'editar', entity: 'produto', entityName: 'reordenação', actor })
  return { success: true }
}

export type DuplicateMode = 'full' | 'shallow'

/**
 * `shallow` copia só o cadastro do produto. `full` também copia módulos,
 * aulas e anexos (arquivo físico no Storage, via copyLessonAttachments —
 * não só a linha do banco). kiwify_product_id nunca é copiado: duas linhas
 * com o mesmo ID quebrariam o lookup do webhook da Kiwify. Certificados
 * nunca são copiados em nenhum modo — são recibo de conclusão por aluno,
 * não conteúdo do produto; a cópia nasce sem nenhum aluno matriculado.
 */
export async function duplicateProduct(id: string, mode: DuplicateMode, actor: Actor): Promise<{ error?: string; newId?: string }> {
  const admin = createAdminClient()
  const { data: original } = await admin.from('products').select('*').eq('id', id).single()
  if (!original) return { error: 'Produto não encontrado.' }

  const { data: maxOrderRow } = await admin.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const nextOrder = (maxOrderRow?.sort_order ?? 0) + 1

  const { data: newProduct, error } = await admin.from('products').insert({
    title: `${original.title} (cópia)`,
    description: original.description,
    banner_url: original.banner_url,
    buy_url: original.buy_url,
    price: original.price,
    billing_cycle: original.billing_cycle,
    content_type: original.content_type,
    content_url: original.content_url,
    kiwify_product_id: null,
    is_pack: original.is_pack,
    sort_order: nextOrder,
    is_active: false,
    is_featured: false,
  }).select('id').single()

  if (error || !newProduct) return { error: error?.message ?? 'Erro ao duplicar produto.' }

  if (mode === 'full') {
    const { data: modules } = await admin.from('modules').select('*').eq('product_id', id).order('sort_order')
    for (const mod of modules ?? []) {
      const { data: newModule, error: modError } = await admin.from('modules').insert({
        product_id: newProduct.id,
        title: mod.title,
        description: mod.description,
        release_type: mod.release_type,
        release_after_days: mod.release_after_days,
        release_at: mod.release_at,
        sort_order: mod.sort_order,
      }).select('id').single()
      if (modError || !newModule) continue

      const { data: lessons } = await admin.from('lessons').select('*').eq('module_id', mod.id).order('sort_order')
      if (lessons?.length) {
        // .select('id') num insert multi-linha preserva a ordem de entrada —
        // usa isso pra mapear aula antiga → aula nova e copiar os anexos de cada uma.
        const { data: newLessons } = await admin.from('lessons').insert(lessons.map(l => ({
          module_id: newModule.id,
          title: l.title,
          description: l.description,
          lesson_type: l.lesson_type,
          content_url: l.content_url,
          content_html: l.content_html,
          is_published: l.is_published,
          release_type: l.release_type,
          release_after_days: l.release_after_days,
          release_at: l.release_at,
          access_duration_days: l.access_duration_days,
          sort_order: l.sort_order,
        }))).select('id')

        for (let i = 0; i < lessons.length && newLessons; i++) {
          const newLessonId = newLessons[i]?.id
          if (!newLessonId) continue
          await copyLessonAttachments(admin, lessons[i].id, newLessonId)
        }
      }
    }
  }

  await logActivity({ action: 'duplicar', entity: 'produto', entityId: newProduct.id, entityName: `${original.title} (cópia)`, actor })
  await fireOutboundWebhooks('product.created', { product: { id: newProduct.id, title: `${original.title} (cópia)` }, actor }, newProduct.id)
  return { newId: newProduct.id }
}
