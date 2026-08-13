/**
 * Grid que nunca comprime itens abaixo de `minItemWidth` — reduz colunas
 * conforme o espaço encolhe, em vez de espremer cada item até virar palito.
 */
export function ResponsiveGrid({
  minItemWidth = '220px',
  gap = 'gap-5',
  className = '',
  children,
}: {
  minItemWidth?: string
  gap?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`grid ${gap} ${className}`}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))` }}
    >
      {children}
    </div>
  )
}
