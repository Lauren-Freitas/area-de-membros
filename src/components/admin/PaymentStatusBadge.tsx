import { PaymentStatus } from '@/types'

const STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  confirmed: { label: '✓ Pago', className: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
  overdue: { label: 'Em atraso', className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
  refunded: { label: 'Reembolsado', className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
  chargeback: { label: 'Chargeback', className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | null }) {
  const style = status ? STYLES[status] : { label: 'Acesso manual', className: 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${style.className}`}>
      {style.label}
    </span>
  )
}
