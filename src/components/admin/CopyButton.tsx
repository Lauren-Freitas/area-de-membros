'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}
