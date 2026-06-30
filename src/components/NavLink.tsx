'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap transition"
      style={active
        ? { backgroundColor: '#f5efe3', color: '#7a5c10' }
        : { color: '#6b7280' }
      }
    >
      {icon}
      {label}
    </Link>
  )
}
