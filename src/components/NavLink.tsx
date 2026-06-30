'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      className="px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap transition"
      style={active
        ? { backgroundColor: '#fdf8e6', color: '#92710a' }
        : { color: '#6b7280' }
      }
    >
      {label}
    </Link>
  )
}
