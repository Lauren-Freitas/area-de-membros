import { stopViewAs } from '@/lib/actions/view-as'

export function ViewAsBanner({ memberName }: { memberName: string }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 py-2 text-white text-sm shadow-md"
      style={{ backgroundColor: 'var(--brand)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">👁️</span>
        <span className="truncate">
          Visualizando como <strong>{memberName}</strong>
          <span className="hidden sm:inline"> (somente leitura)</span>
        </span>
      </div>
      <form action={stopViewAs} className="shrink-0 ml-3">
        <button
          type="submit"
          className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition whitespace-nowrap"
        >
          Sair
        </button>
      </form>
    </div>
  )
}
