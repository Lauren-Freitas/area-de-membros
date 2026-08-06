/**
 * Taxonomia de escopos das chaves de API — modelo simples por recurso,
 * pensado pra crescer sem quebrar compatibilidade: uma chave nova sempre
 * declara escopos explicitamente; uma chave antiga (criada antes deste
 * recurso existir, `scopes` null no banco) continua com acesso irrestrito
 * — nunca perde acesso silenciosamente só porque o modelo de permissões
 * mudou por baixo dela.
 */
export const ALL_SCOPES = [
  'members:read', 'members:write', 'members:delete',
  'products:read', 'products:write', 'products:delete',
  'access:read', 'access:write',
  'sales:read',
  'certificates:read', 'certificates:write',
  'invites:read', 'invites:write',
  'webhooks:read',
  'api_keys:manage',
] as const

export type ApiScope = typeof ALL_SCOPES[number]

export const SCOPE_LABELS: Record<ApiScope, string> = {
  'members:read': 'Ver membros',
  'members:write': 'Criar e editar membros',
  'members:delete': 'Excluir membros',
  'products:read': 'Ver produtos',
  'products:write': 'Criar e editar produtos',
  'products:delete': 'Excluir produtos',
  'access:read': 'Ver acessos concedidos',
  'access:write': 'Conceder, alterar e revogar acesso',
  'sales:read': 'Ver vendas',
  'certificates:read': 'Ver certificados',
  'certificates:write': 'Emitir certificados',
  'invites:read': 'Ver convites',
  'invites:write': 'Criar convites',
  'webhooks:read': 'Ver webhooks configurados',
  'api_keys:manage': 'Gerenciar chaves de API',
}

export const SCOPE_GROUPS: { title: string; scopes: ApiScope[] }[] = [
  { title: 'Membros', scopes: ['members:read', 'members:write', 'members:delete'] },
  { title: 'Produtos', scopes: ['products:read', 'products:write', 'products:delete'] },
  { title: 'Acessos', scopes: ['access:read', 'access:write'] },
  { title: 'Vendas', scopes: ['sales:read'] },
  { title: 'Certificados', scopes: ['certificates:read', 'certificates:write'] },
  { title: 'Convites', scopes: ['invites:read', 'invites:write'] },
  { title: 'Webhooks', scopes: ['webhooks:read'] },
  { title: 'Chaves de API', scopes: ['api_keys:manage'] },
]

export interface ScopedAuth {
  scopes?: ApiScope[] | null
}

/** `null`/`undefined` = sem restrição (chave mestra, ou chave nomeada com "acesso total"). */
export function hasScope(auth: ScopedAuth, required: ApiScope): boolean {
  if (auth.scopes == null) return true
  return auth.scopes.includes(required)
}

export function isValidScope(value: string): value is ApiScope {
  return (ALL_SCOPES as readonly string[]).includes(value)
}
