import { PaymentStatus } from '@/types'

const STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  confirmed: { label: '✓ Pago', className: 'bg-green-50 text-green-700' },
  overdue: { label: 'Em atraso', className: 'bg-amber-50 text-amber-700' },
  refunded: { label: 'Reembolsado', className: 'bg-red-50 text-red-600' },
  chargeback: { label: 'Chargeback', className: 'bg-red-50 text-red-600' },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | null }) {
  const style = status ? STYLES[status] : { label: 'Acesso manual', className: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${style.className}`}>
      {style.label}
    </span>
  )
}
