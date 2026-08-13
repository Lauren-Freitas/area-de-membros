import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

const base = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#374151] text-sm bg-white dark:bg-[#111827] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent transition'

/** Select padrão do painel — ver Input.tsx pro mesmo raciocínio de unificação. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', style, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`${base} ${className}`}
        style={{ '--tw-ring-color': 'var(--brand)', ...style } as React.CSSProperties}
        {...props}
      >
        {children}
      </select>
    )
  },
)
