/**
 * Traduz uma linha de activity_logs numa descrição legível pro histórico do
 * membro. entity_name de ações de acesso é gravado como "{membro} → {produto}"
 * (ver grantAccess/revokeAccess/updateAccessExpiry em actions/admin.ts) — como
 * o histórico já está filtrado por membro, extrai só a parte do produto.
 */

interface ActivityRow {
  action: string
  entity: string
  entity_name: string | null
}

function productFromEntityName(entityName: string | null): string {
  if (!entityName) return 'produto'
  const parts = entityName.split('→').map(s => s.trim())
  return parts.length === 2 ? parts[1] : entityName
}

export function describeActivity(entry: ActivityRow): string {
  const product = productFromEntityName(entry.entity_name)
  switch (entry.action) {
    case 'conceder_acesso': return `${product} liberado`
    case 'revogar_acesso': return `${product} removido`
    case 'editar':
      return entry.entity === 'validade_acesso' ? `Validade de ${product} alterada` : 'Dados atualizados'
    case 'ativar': return 'Membro reativado'
    case 'desativar': return 'Membro desativado'
    case 'criar': return 'Membro criado'
    case 'excluir': return 'Membro excluído'
    case 'ver_como': return 'Visualizado pela equipe'
    case 'enviar_convite': return 'Convite enviado'
    case 'enviar_login': return 'Login reenviado'
    default: return entry.action
  }
}

// ── Vocabulário genérico de exibição (admin/atividades + dashboard) ────────
// Extraído de admin/atividades/page.tsx pra ser reaproveitado também no
// widget de atividade recente do dashboard, em vez de duas cópias divergentes.

export const ACTION_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  criar:             { label: 'Criou',            bg: '#dcfce7', text: '#15803d' },
  editar:            { label: 'Editou',            bg: '#dbeafe', text: '#1d4ed8' },
  excluir:           { label: 'Excluiu',           bg: '#fee2e2', text: '#b91c1c' },
  ativar:            { label: 'Ativou',            bg: '#d1fae5', text: '#065f46' },
  desativar:         { label: 'Desativou',         bg: '#f3f4f6', text: '#4b5563' },
  conceder_acesso:   { label: 'Concedeu acesso',   bg: '#d1fae5', text: '#065f46' },
  revogar_acesso:    { label: 'Revogou acesso',    bg: '#ffedd5', text: '#c2410c' },
  adicionar_turma:   { label: 'Adicionou à turma', bg: '#ede9fe', text: '#6d28d9' },
  remover_turma:     { label: 'Removeu da turma',  bg: '#fce7f3', text: '#9d174d' },
  salvar_aparencia:  { label: 'Salvou aparência',  bg: '#ede9fe', text: '#7c3aed' },
  restaurar_aparencia: { label: 'Restaurou aparência', bg: '#fef3c7', text: '#92400e' },
  ver_como:          { label: 'Visualizou como',   bg: '#e0f2fe', text: '#0369a1' },
  responder:         { label: 'Respondeu',         bg: '#dbeafe', text: '#1d4ed8' },
}

export const ENTITY_LABEL: Record<string, string> = {
  produto: 'Produto', modulo: 'Módulo', aula: 'Aula',
  membro: 'Membro', acesso: 'Acesso', banner: 'Banner',
  oferta: 'Oferta', turma: 'Turma', convite: 'Convite',
  api_key: 'API Key', webhook: 'Webhook', aparencia: 'Aparência',
  chamado: 'Chamado',
}

export const ROLE_STYLE: Record<string, { label: string; color: string }> = {
  admin:  { label: 'Admin',  color: 'var(--brand)' },
  equipe: { label: 'Equipe', color: '#6d28d9' },
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'agora mesmo'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m} min atrás`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d atrás`
  const mo = Math.floor(d / 30)
  return `${mo} mes${mo > 1 ? 'es' : ''} atrás`
}
