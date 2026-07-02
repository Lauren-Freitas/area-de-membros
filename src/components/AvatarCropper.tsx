'use client'

import { useEffect, useRef, useState } from 'react'

const SIZE = 256

export function AvatarCropper({ src, onConfirm, onCancel }: {
  src: string
  onConfirm: (previewUrl: string, file: File) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [minScale, setMinScale] = useState(0.1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  // Load image — crossOrigin must be set BEFORE src to avoid tainted canvas on external URLs
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      const nw = img.naturalWidth || img.width
      const nh = img.naturalHeight || img.height
      // * 1.002 ensures float precision never leaves a 1px gap at the canvas edge
      const fit = Math.max(SIZE / nw, SIZE / nh) * 1.002
      setMinScale(fit * 0.5)
      setScale(fit)
      setOffset({ x: 0, y: 0 })
    }
    img.src = src
  }, [src])

  // Draw whenever scale or offset changes
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, SIZE, SIZE)
    const nw = img.naturalWidth || img.width
    const nh = img.naturalHeight || img.height
    const w = Math.ceil(nw * scale)
    const h = Math.ceil(nh * scale)
    const x = Math.floor(SIZE / 2 - w / 2 + offset.x)
    const y = Math.floor(SIZE / 2 - h / 2 + offset.y)
    ctx.drawImage(img, x, y, w, h)
  })

  // Pointer drag handlers
  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    setOffset({
      x: dragStart.current.ox + e.clientX - dragStart.current.mx,
      y: dragStart.current.oy + e.clientY - dragStart.current.my,
    })
  }
  function onPointerUp() { dragging.current = false }

  function confirm() {
    canvasRef.current!.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      onConfirm(URL.createObjectURL(blob), file)
    }, 'image/jpeg', 0.92)
  }

  const pct = Math.round((scale / (minScale * 2)) * 100)

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl p-6 w-full max-w-xs space-y-4 shadow-xl">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Ajustar foto</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Arraste para reposicionar. Use o slider para zoom.</p>
        </div>

        <div className="flex justify-center">
          <div className="rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700" style={{ width: SIZE, height: SIZE }}>
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              className="cursor-grab active:cursor-grabbing select-none touch-none"
              style={{ width: SIZE, height: SIZE, display: 'block' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Zoom</span>
            <span>{pct}%</span>
          </div>
          <input
            type="range"
            min={minScale}
            max={minScale * 8}
            step={minScale / 50}
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            className="w-full accent-[#b48840]"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={confirm}
            className="flex-1 py-2.5 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: '#b48840' }}
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
