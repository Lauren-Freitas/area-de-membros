'use client'

interface SwitchProps {
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  activeLabel?: string
  inactiveLabel?: string
  title?: string
}

export function Switch({ name, checked, onChange, label, activeLabel = 'Ativo', inactiveLabel = 'Inativo', title }: SwitchProps) {
  return (
    <label htmlFor={name} title={title} className="flex items-center gap-2 cursor-pointer select-none shrink-0">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <span className="text-sm font-medium text-gray-600">{checked ? activeLabel : inactiveLabel}</span>
      <span className="relative inline-block w-11 h-6">
        <input
          type="checkbox"
          name={name}
          id={name}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-gray-300 peer-checked:bg-emerald-500 transition-colors" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}
