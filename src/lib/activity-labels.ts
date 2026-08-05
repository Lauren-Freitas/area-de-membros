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
