// Compatibilidade temporária — a API oficial é /api/v1/members. Este caminho
// continua funcionando (mesmo handler, mesmo comportamento), só o nome muda.
export { GET, POST } from '@/app/api/v1/members/route'
