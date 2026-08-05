import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'sm' | 'md'

const base = 'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

const sizeClass: Record<Size, string> = {
  md: 'gap-1.5 text-sm rounded-[11px] px-4 py-2.5',
  sm: 'gap-1 text-xs rounded-lg px-3 py-1.5',
}

const variantClass: Record<Variant, string> = {
  primary: 'text-white shadow-sm hover:brightness-95',
  secondary: 'bg-gray-100 dark:bg-[#1a2035] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#232945]',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }

export function Button(props: AsButton | AsLink) {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props
  const classes = `${base} ${sizeClass[size]} ${variantClass[variant]} ${className}`
  const style = variant === 'primary' ? { backgroundColor: 'var(--brand)' } : undefined

  if ('href' in rest && rest.href) {
    const { href, ...anchorProps } = rest as Omit<AsLink, keyof CommonProps>
    const isExternal = /^https?:\/\//.test(href)
    if (isExternal) {
      return (
        <a href={href} className={classes} style={style} target="_blank" rel="noopener noreferrer" {...anchorProps}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={classes} style={style} {...anchorProps}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} style={style} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
