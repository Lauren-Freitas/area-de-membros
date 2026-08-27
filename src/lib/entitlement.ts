/**
 * `user_products.expires_at` nulo é acesso vitalício por convenção em toda a
 * plataforma (ver /assinatura, ProductCard). Uma data no passado é expirado.
 */
export function isAccessExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  return expiresAt != null && new Date(expiresAt).getTime() <= now.getTime()
}
