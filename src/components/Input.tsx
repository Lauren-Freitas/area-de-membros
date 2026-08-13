import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

const base = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#374151] text-sm bg-white dark:bg-[#111827] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition'

/** Input de texto padrão do painel — mesma altura/padding/radius já predominante, anel de foco na cor da marca em vez de amarelo hardcoded, dark mode sempre presente. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', style, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`${base} ${className}`}
        style={{ '--tw-ring-color': 'var(--brand)', ...style } as React.CSSProperties}
        {...props}
      />
    )
  },
)
