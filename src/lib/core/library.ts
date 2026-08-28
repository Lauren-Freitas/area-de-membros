import type { SupabaseClient } from '@supabase/supabase-js'
import { LibraryItem } from '@/types'
import { isAccessExpired } from '@/lib/entitlement'

export const LIBRARY_PAGE_SIZE = 18

export interface LibraryFilters {
  q?: string
  territorio?: string
  trilha?: string
  tipo?: string
}

export interface LibraryPage {
  items: LibraryItem[]
  hasMore: boolean
}

/**
 * Filtra e pagina library_items. Trilha é multivalorada (até 2 por
 * conteúdo), então não dá pra filtrar direto na view -- resolve os
 * content_id que batem via content_skill_tracks primeiro, e restringe
 * a query principal a esse conjunto.
 */
export async function queryLibraryItems(
  client: SupabaseClient,
  filters: LibraryFilters,
  offset = 0
): Promise<LibraryPage> {
  const [territoryId, formatId, trackContentIds] = await Promise.all([
    filters.territorio ? resolveId(client, 'territories', filters.territorio) : Promise.resolve(null),
    filters.tipo ? resolveId(client, 'content_formats', filters.tipo) : Promise.resolve(null),
    filters.trilha ? resolveTrackContentIds(client, filters.trilha) : Promise.resolve(null),
  ])

  // Trilha pedida mas sem id válido (slug errado) ou sem nenhum conteúdo -- não tem o que buscar.
  if (filters.trilha && (!trackContentIds || trackContentIds.length === 0)) {
    return { items: [], hasMore: false }
  }

  let query = client
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (territoryId) query = query.eq('territory_id', territoryId)
  if (formatId) query = query.eq('content_format_id', formatId)
  if (trackContentIds) query = query.in('content_id', trackContentIds)
  const q = filters.q?.trim()
  if (q && q.length >= 2) query = query.ilike('title', `%${q}%`)

  // busca um item a mais que a página pra saber se tem "carregar mais" sem contar tudo
  const { data, error } = await query.range(offset, offset + LIBRARY_PAGE_SIZE)
  if (error) return { items: [], hasMore: false }

  const rows = (data ?? []) as LibraryItem[]
  return { items: rows.slice(0, LIBRARY_PAGE_SIZE), hasMore: rows.length > LIBRARY_PAGE_SIZE }
}

async function resolveId(client: SupabaseClient, table: string, slug: string): Promise<string | null> {
  const { data } = await client.from(table).select('id').eq('slug', slug).maybeSingle()
  return data?.id ?? null
}

async function resolveTrackContentIds(client: SupabaseClient, slug: string): Promise<string[] | null> {
  const trackId = await resolveId(client, 'skill_tracks', slug)
  if (!trackId) return null
  const { data } = await client.from('content_skill_tracks').select('lesson_id, product_id').eq('skill_track_id', trackId)
  return (data ?? []).map(r => (r.lesson_id ?? r.product_id) as string).filter(Boolean)
}

export interface FacetCount {
  id: string
  slug: string
  title: string
  description: string | null
  count: number
}

/**
 * Contagem de conteúdo por território e por trilha, pra decidir o
 * tratamento visual de cada tile (com número vs. sem número, nunca "0").
 * Só busca as colunas de id -- leve mesmo com centenas de itens.
 */
export async function getFacetCounts(client: SupabaseClient): Promise<{ territories: FacetCount[]; tracks: FacetCount[] }> {
  const [{ data: territories }, { data: tracks }, { data: itemTerritories }, { data: skillRows }] = await Promise.all([
    client.from('territories').select('id, slug, title, description').eq('is_active', true).order('sort_order'),
    client.from('skill_tracks').select('id, slug, title, description').eq('is_active', true).order('sort_order'),
    client.from('library_items').select('territory_id'),
    client.from('content_skill_tracks').select('skill_track_id'),
  ])

  const territoryCounts = new Map<string, number>()
  for (const row of itemTerritories ?? []) {
    if (row.territory_id) territoryCounts.set(row.territory_id, (territoryCounts.get(row.territory_id) ?? 0) + 1)
  }
  const trackCounts = new Map<string, number>()
  for (const row of skillRows ?? []) {
    trackCounts.set(row.skill_track_id, (trackCounts.get(row.skill_track_id) ?? 0) + 1)
  }

  return {
    territories: (territories ?? []).map(t => ({ ...t, count: territoryCounts.get(t.id) ?? 0 })),
    tracks: (tracks ?? []).map(t => ({ ...t, count: trackCounts.get(t.id) ?? 0 })),
  }
}

export interface LibraryAccessInfo {
  hasAccess: boolean
  isExpired: boolean
  isCompleted: boolean
}

/** Acesso (e conclusão, no nível de produto) do membro pros produtos por trás dos itens da página atual. */
export async function getAccessMap(
  client: SupabaseClient,
  userId: string,
  productIds: string[]
): Promise<Record<string, LibraryAccessInfo>> {
  const ids = [...new Set(productIds)]
  if (ids.length === 0) return {}
  const { data } = await client
    .from('user_products')
    .select('product_id, expires_at, is_completed')
    .eq('user_id', userId)
    .in('product_id', ids)

  const map: Record<string, LibraryAccessInfo> = {}
  for (const row of data ?? []) {
    map[row.product_id as string] = {
      hasAccess: true,
      isExpired: isAccessExpired(row.expires_at as string | null),
      isCompleted: (row.is_completed as boolean) ?? false,
    }
  }
  return map
}

/** Conclusão no nível de aula (distinto de is_completed de produto) pros itens do tipo 'lesson' na página atual. */
export async function getCompletedLessonIds(
  client: SupabaseClient,
  userId: string,
  lessonIds: string[]
): Promise<Set<string>> {
  const ids = [...new Set(lessonIds)]
  if (ids.length === 0) return new Set()
  const { data } = await client.from('lesson_progress').select('lesson_id').eq('user_id', userId).in('lesson_id', ids)
  return new Set((data ?? []).map(r => r.lesson_id as string))
}

/** Monta a URL de /biblioteca preservando os filtros atuais e aplicando um patch (undefined remove a chave). */
export function buildBibliotecaHref(current: LibraryFilters, patch: Partial<LibraryFilters>): string {
  const merged = { ...current, ...patch }
  const params = new URLSearchParams()
  if (merged.q) params.set('q', merged.q)
  if (merged.territorio) params.set('territorio', merged.territorio)
  if (merged.trilha) params.set('trilha', merged.trilha)
  if (merged.tipo) params.set('tipo', merged.tipo)
  const qs = params.toString()
  return qs ? `/biblioteca?${qs}` : '/biblioteca'
}
