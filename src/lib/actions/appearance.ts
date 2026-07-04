'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APPEARANCE_DEFAULTS } from '@/lib/appearance-defaults'

export async function saveAppearance(
  values: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()
    const rows = Object.entries(values).map(([key, value]) => ({ key, value: String(value) }))
    const { error } = await adminClient
      .from('site_config')
      .upsert(rows, { onConflict: 'key' })
    if (error) {
      console.error('[saveAppearance] Supabase error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.error('[saveAppearance] Exception:', err)
    return { ok: false, error: String(err) }
  }
}

export async function restoreAppearanceDefaults(): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()
    const rows = Object.entries(APPEARANCE_DEFAULTS).map(([key, value]) => ({ key, value }))
    const { error } = await adminClient
      .from('site_config')
      .upsert(rows, { onConflict: 'key' })
    if (error) {
      console.error('[restoreAppearanceDefaults] Supabase error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.error('[restoreAppearanceDefaults] Exception:', err)
    return { ok: false, error: String(err) }
  }
}
