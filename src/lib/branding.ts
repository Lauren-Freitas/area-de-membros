import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { deriveBrandTokens, withLightness } from '@/lib/color'

/**
 * Camada única de resolução de branding: site_config → tokens de design.
 * Hoje resolve a config global (singleton). Se um dia existir mais de um
 * tenant, este é o único lugar que precisa aprender a receber um tenantId —
 * nenhum outro arquivo faz a própria leitura de site_config.
 */
export const getSiteConfig = cache(async (): Promise<Record<string, string>> => {
  try {
    const adminClient = createAdminClient()
    const { data: rows } = await adminClient.from('site_config').select('key, value')
    return Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))
  } catch {
    return {}
  }
})

/** Monta o CSS de tokens (`:root{...}.dark{...}`) a partir da config resolvida. */
export function buildBrandCss(cfg: Record<string, string>): string {
  try {
    const primary = cfg.primary_color || '#b48840'
    const brandLight = cfg.brand_light || '#d2b17b'
    const tokens = deriveBrandTokens(primary)

    // Modo escuro usa a cor de destaque (mais clara) como --brand principal, senão o
    // acento fica ilegível em cima de fundo quase preto.
    const light: string[] = [
      `--brand:${primary}`,
      `--brand-light:${brandLight}`,
      `--brand-bg:${tokens.light.bg}`,
      `--brand-border:${tokens.light.border}`,
      `--brand-text:${tokens.light.text}`,
    ]
    const dark: string[] = [
      `--brand:${brandLight}`,
      `--brand-light:${withLightness(primary, 85, 0.75)}`,
      `--brand-bg:${tokens.dark.bg}`,
      `--brand-border:${tokens.dark.border}`,
      `--brand-text:${tokens.dark.text}`,
    ]
    if (cfg.bg_light) light.push(`--background:${cfg.bg_light}`)
    if (cfg.bg_dark) dark.push(`--background:${cfg.bg_dark}`)
    if (cfg.card_bg_light) light.push(`--card:${cfg.card_bg_light}`)
    if (cfg.card_bg_dark) dark.push(`--card:${cfg.card_bg_dark}`)
    return `:root{${light.join(';')}}.dark{${dark.join(';')}}`
  } catch {
    return ''
  }
}
