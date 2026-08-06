// Compatibilidade temporária — a API oficial é /api/v1/members/:id/resend-access
// (que já reúne o que antes eram dois nomes pra mesma coisa: reenviar-convite e resetar-senha).
export { POST } from '@/app/api/v1/members/[id]/resend-access/route'
