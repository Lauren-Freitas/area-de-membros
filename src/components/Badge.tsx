export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'brand'

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  neutral: 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  brand: 'bg-brand-bg text-brand-text',
}

/** Pill de status genérico — mesma escala visual usada em PaymentStatusBadge, pra qualquer status que não seja pagamento. */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  )
}
