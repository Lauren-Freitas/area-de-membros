import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

const base = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#374151] text-sm bg-white dark:bg-[#111827] text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition'

/** Textarea padrão do painel — ver Input.tsx pro mesmo raciocínio de unificação. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', style, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${base} ${className}`}
        style={{ '--tw-ring-color': 'var(--brand)', ...style } as React.CSSProperties}
        {...props}
      />
    )
  },
)
