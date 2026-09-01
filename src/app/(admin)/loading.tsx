/**
 * Fallback genérico do grupo (admin) -- não reproduz o layout de nenhuma
 * página específica. Cobre apenas o tempo de {children}; o fetch do
 * AdminLayout (auth/perfil) roda antes disso e não é coberto por este
 * boundary.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-40 rounded-lg bg-gray-200 dark:bg-[#1a2035]" />
      <div className="h-32 rounded-2xl bg-gray-100 dark:bg-[#0d1020]" />
      <div className="h-10 rounded-xl bg-gray-100 dark:bg-[#0d1020]" />
      <div className="h-10 rounded-xl bg-gray-100 dark:bg-[#0d1020]" />
      <div className="h-10 rounded-xl bg-gray-100 dark:bg-[#0d1020]" />
    </div>
  )
}
