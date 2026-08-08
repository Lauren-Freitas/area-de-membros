/** Estado vazio genérico — título + descrição opcional + ação opcional, mesmo padrão de espaçamento (`py-16`) já usado nas listas do painel. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="py-16 flex flex-col items-center gap-2 text-center">
      {icon && <div className="text-gray-300 dark:text-gray-600">{icon}</div>}
      <p className="text-sm text-gray-400">{title}</p>
      {description && <p className="text-xs text-gray-400 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
