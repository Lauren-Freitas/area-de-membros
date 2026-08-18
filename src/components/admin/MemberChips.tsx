'use client'

import { Menu } from '@/components/Menu'

export function MemberChips({ titles }: { titles: string[] }) {
  if (titles.length === 0) return <span className="text-xs text-gray-300">-</span>

  const visible = titles.slice(0, 3)
  const rest = titles.slice(3)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map(t => (
        <span
          key={t}
          className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a2035] text-gray-600 dark:text-gray-300 truncate max-w-[110px]"
          title={t}
        >
          {t}
        </span>
      ))}
      {rest.length > 0 && (
        <Menu
          align="left"
          panelClassName="w-56"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a2035] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#232945] transition"
            >
              +{rest.length}
            </button>
          )}
        >
          <div className="p-2 max-h-52 overflow-y-auto">
            {rest.map(t => (
              <p key={t} className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1.5 truncate">{t}</p>
            ))}
          </div>
        </Menu>
      )}
    </div>
  )
}
