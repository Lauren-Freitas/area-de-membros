interface Props {
  product: { title: string; is_active: boolean }
}

/**
 * Clone flutuante mostrado dentro do DragOverlay enquanto uma linha é
 * arrastada — só precisa parecer a linha real, não precisa ser interativo
 * (menu/handle), ele some assim que solta.
 */
export function ProductDragPreview({ product }: Props) {
  return (
    <div className="flex items-center py-3.5 gap-3 pl-5 pr-4 bg-card rounded-xl shadow-lg scale-[1.02] border border-gray-100 dark:border-[#1e2030]">
      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="7" cy="5" r="1.3" /><circle cx="13" cy="5" r="1.3" />
        <circle cx="7" cy="10" r="1.3" /><circle cx="13" cy="10" r="1.3" />
        <circle cx="7" cy="15" r="1.3" /><circle cx="13" cy="15" r="1.3" />
      </svg>
      <p className="flex-1 min-w-0 font-medium text-gray-900 truncate">{product.title}</p>
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
          product.is_active
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400'
        }`}
      >
        {product.is_active ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  )
}
