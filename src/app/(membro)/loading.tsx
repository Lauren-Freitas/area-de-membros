/**
 * Fallback genérico do grupo (membro) -- não reproduz o layout de nenhuma
 * página específica (isso fica pra uma etapa futura, se necessário). Cobre
 * apenas o tempo de {children}; o fetch do MemberLayout (auth/perfil/
 * notificações) roda antes disso e não é coberto por este boundary.
 */
export default function MemberLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded-lg bg-gray-200 dark:bg-[#1a2035]" />
      <div className="h-40 rounded-2xl bg-gray-100 dark:bg-[#12162a]" />
      <div className="h-24 rounded-2xl bg-gray-100 dark:bg-[#12162a]" />
      <div className="h-24 rounded-2xl bg-gray-100 dark:bg-[#12162a]" />
    </div>
  )
}
