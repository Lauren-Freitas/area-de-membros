import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberTabs } from '@/components/MemberTabs'
import { ProgressoTab } from './ProgressoTab'
import { RankingTab } from './RankingTab'

const TABS = [
  { key: 'xp', label: 'Meu progresso' },
  { key: 'ranking', label: 'Ranking' },
]

export default async function ProgressoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = tab === 'ranking' ? 'ranking' : 'xp'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Progresso</h1>
      <MemberTabs tabs={TABS} active={active} basePath="/progresso" />
      {active === 'xp' ? <ProgressoTab userId={user.id} /> : <RankingTab userId={user.id} />}
    </div>
  )
}
