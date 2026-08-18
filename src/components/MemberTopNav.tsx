'use client'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from '@/components/NavLink'
import type { MemberNavItem } from '@/lib/member-nav'

/**
 * Barra de navegação horizontal do topo — itens fixos + um por produto
 * liberado. Com muitos produtos ela transborda a largura da tela; o scroll
 * horizontal já existia, mas sem nenhuma pista visual de que há mais
 * conteúdo pra ver, então a última aba parecia só "cortada". Aqui: fades
 * nas bordas que só aparecem quando há mais conteúdo pra esse lado, e a
 * roda do mouse (vertical) também move o scroll horizontal.
 */
export function MemberTopNav({ navItems, products }: {
  navItems: MemberNavItem[]
  products: { id: string; title: string }[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateFades() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    updateFades()
    const el = scrollRef.current
    if (!el) return
    const onResize = () => updateFades()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [navItems, products])

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    // Mouse comum só manda delta vertical — converte pra scroll horizontal
    // nessa barra, senão dá pra rolar só arrastando (touch/trackpad).
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY
      e.preventDefault()
    }
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10"
          style={{ background: 'linear-gradient(to right, var(--card), transparent)' }}
        />
      )}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10"
          style={{ background: 'linear-gradient(to left, var(--card), transparent)' }}
        />
      )}
      <div
        ref={scrollRef}
        onScroll={updateFades}
        onWheel={handleWheel}
        className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-10 overflow-x-auto scrollbar-none"
      >
        {navItems.map(item => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
        {products.length > 0 && (
          <>
            <span className="w-px h-4 bg-gray-200 dark:bg-[#2a2f45] mx-1 shrink-0" />
            {products.map(p => (
              <NavLink key={p.id} href={`/produto/${p.id}`} label={p.title} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
