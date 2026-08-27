import type { SupabaseClient } from '@supabase/supabase-js'
import { Territory, SkillTrack, ContentFormat } from '@/types'

export interface TaxonomyCatalogs {
  territories: Territory[]
  skillTracks: SkillTrack[]
  contentFormats: ContentFormat[]
}

/** Catálogos ativos, ordenados — usados pra popular os seletores de classificação no admin. */
export async function getTaxonomyCatalogs(
  client: SupabaseClient
): Promise<TaxonomyCatalogs> {
  const [{ data: territories, error: e1 }, { data: skillTracks, error: e2 }, { data: contentFormats, error: e3 }] = await Promise.all([
    client.from('territories').select('*').eq('is_active', true).order('sort_order'),
    client.from('skill_tracks').select('*').eq('is_active', true).order('sort_order'),
    client.from('content_formats').select('*').eq('is_active', true).order('sort_order'),
  ])
  if (e1) console.error('[getTaxonomyCatalogs] territories:', e1.message)
  if (e2) console.error('[getTaxonomyCatalogs] skill_tracks:', e2.message)
  if (e3) console.error('[getTaxonomyCatalogs] content_formats:', e3.message)
  return {
    territories: (territories ?? []) as Territory[],
    skillTracks: (skillTracks ?? []) as SkillTrack[],
    contentFormats: (contentFormats ?? []) as ContentFormat[],
  }
}

type SkillTrackOwner = { lessonId: string; productId?: undefined } | { lessonId?: undefined; productId: string }

/** Trilhas já atribuídas a uma aula ou produto avulso — pra pré-preencher o formulário de edição. */
export async function getSelectedSkillTrackIds(
  client: SupabaseClient,
  owner: SkillTrackOwner
): Promise<string[]> {
  const column = owner.lessonId ? 'lesson_id' : 'product_id'
  const value = owner.lessonId ?? owner.productId
  const { data } = await client.from('content_skill_tracks').select('skill_track_id').eq(column, value as string)
  return (data ?? []).map(r => r.skill_track_id as string)
}

const MAX_SKILL_TRACKS = 2

/**
 * Substitui as trilhas atribuídas a uma aula/produto pelo conjunto informado.
 * O limite de MAX_SKILL_TRACKS é aplicado aqui, no server, não só na UI — um
 * envio direto pra action com 3+ ids é rejeitado antes de tocar o banco.
 */
export async function syncSkillTracks(
  client: SupabaseClient,
  owner: SkillTrackOwner,
  skillTrackIds: string[]
): Promise<{ error?: string }> {
  const uniqueIds = [...new Set(skillTrackIds.filter(Boolean))]
  if (uniqueIds.length > MAX_SKILL_TRACKS) {
    return { error: `No máximo ${MAX_SKILL_TRACKS} trilhas de habilidade por conteúdo.` }
  }

  const column = owner.lessonId ? 'lesson_id' : 'product_id'
  const value = owner.lessonId ?? owner.productId

  const { error: deleteError } = await client.from('content_skill_tracks').delete().eq(column, value as string)
  if (deleteError) return { error: deleteError.message }

  if (uniqueIds.length > 0) {
    const { error: insertError } = await client
      .from('content_skill_tracks')
      .insert(uniqueIds.map(skill_track_id => ({ [column]: value, skill_track_id })))
    if (insertError) return { error: insertError.message }
  }

  return {}
}
