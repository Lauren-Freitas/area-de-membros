import Link from 'next/link'

export interface MemberTab { key: string; label: string }

/**
 * Abas server-driven (estado na URL, ?tab=), mesmo padrão do filtro da
 * Biblioteca e do ProductTabs do admin. overflow-y-hidden + py-0.5 evita o
 * corte vertical no texto que já corrigimos uma vez no admin.
 */
export function MemberTabs({ tabs, active, basePath }: { tabs: MemberTab[]; active: string; basePath: string }) {
  return (
    <div className="flex items-center gap-1 mb-6 border-b border-gray-100 dark:border-[#1e2030] overflow-x-auto overflow-y-hidden py-0.5 scrollbar-none">
      {tabs.map(t => {
        const isDefault = t.key === tabs[0].key
        const href = isDefault ? basePath : `${basePath}?tab=${t.key}`
        const isActive = active === t.key
        return (
          <Link
            key={t.key}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
              isActive ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
            style={isActive ? { color: 'var(--brand)', borderColor: 'var(--brand)' } : {}}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
