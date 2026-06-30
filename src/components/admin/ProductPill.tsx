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
          ? { backgroundColor: '#fdf6e8', color: '#7a5c10', borderColor: '#e8d5a3' }
          : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
        }
        onMouseEnter={e => {
          const el = e.currentTarget
          if (hasAccess) {
            el.style.backgroundColor = '#fef2f2'
            el.style.color = '#dc2626'
            el.style.borderColor = '#fecaca'
          } else {
            el.style.backgroundColor = '#fdf6e8'
            el.style.color = '#7a5c10'
            el.style.borderColor = '#e8d5a3'
          }
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          if (hasAccess) {
            el.style.backgroundColor = '#fdf6e8'
            el.style.color = '#7a5c10'
            el.style.borderColor = '#e8d5a3'
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
