'use client'

import { useRef } from 'react'

interface Props {
  src: string | null
  initials: string
  onEdit: () => void
  onUpdate: (file: File) => void
  onDelete: () => void
  onClose: () => void
}

export function AvatarPhotoModal({ src, initials, onEdit, onUpdate, onDelete, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) { onUpdate(file); e.target.value = '' }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1e2235] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-white font-semibold text-base">Foto de perfil</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo */}
        <div className="flex items-center justify-center py-10 bg-[#181c2e]">
          {src ? (
            <div className="w-44 h-44 rounded-full overflow-hidden border-2 border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Foto de perfil" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-44 h-44 rounded-full flex items-center justify-center text-4xl font-bold text-white"
              style={{ backgroundColor: '#b48840' }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center border-t border-white/10">
          {src && (
            <button
              onClick={onEdit}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 text-white hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 2.828L11.828 13.828A2 2 0 0110.414 14H9v-1.414A2 2 0 019.586 11z" />
              </svg>
              <span className="text-xs font-medium">Editar</span>
            </button>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-1.5 py-4 text-white hover:bg-white/10 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Atualizar</span>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />

          {src && (
            <button
              onClick={onDelete}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 text-red-400 hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-xs font-medium">Excluir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
