import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

const base = 'inline-flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-5 py-2.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

const variantClass: Record<Variant, string> = {
  primary: 'text-white hover:opacity-90 hover:shadow-md',
  secondary: 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2035]',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30',
}

interface CommonProps {
  variant?: Variant
  className?: string
  children: ReactNode
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }

export function Button(props: AsButton | AsLink) {
  const { variant = 'primary', className = '', children, ...rest } = props
  const classes = `${base} ${variantClass[variant]} ${className}`
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
