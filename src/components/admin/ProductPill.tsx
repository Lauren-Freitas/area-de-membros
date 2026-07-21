'use client'

interface Props {
  title: string
  hasAccess: boolean
  action: () => void
}

export function ProductPill({ title, hasAccess, action }: Props) {
  return (
    <form action={action}>
      <button
        type="submit"
        title={hasAccess ? 'Clique para revogar acesso' : 'Clique para liberar acesso'}
        className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
        style={hasAccess
          ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)', borderColor: 'var(--brand-border)' }
          : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
        }
        onMouseEnter={e => {
          const el = e.currentTarget
          if (hasAccess) {
            el.style.backgroundColor = '#fef2f2'
            el.style.color = '#dc2626'
            el.style.borderColor = '#fecaca'
          } else {
            el.style.backgroundColor = 'var(--brand-bg)'
            el.style.color = 'var(--brand-text)'
            el.style.borderColor = 'var(--brand-border)'
          }
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          if (hasAccess) {
            el.style.backgroundColor = 'var(--brand-bg)'
            el.style.color = 'var(--brand-text)'
            el.style.borderColor = 'var(--brand-border)'
          } else {
            el.style.backgroundColor = '#f9fafb'
            el.style.color = '#6b7280'
            el.style.borderColor = '#e5e7eb'
          }
        }}
      >
        {hasAccess ? '✓ ' : '+ '}
        {title}
      </button>
    </form>
  )
}
