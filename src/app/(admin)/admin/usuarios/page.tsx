import { listMembers } from '@/lib/actions/members'
import { MembersTable } from '@/components/admin/MembersTable'

export default async function AdminUsuariosPage() {
  const { members, total } = await listMembers({ page: 1, pageSize: 25 })

  return <MembersTable initialMembers={members} initialTotal={total} />
}
