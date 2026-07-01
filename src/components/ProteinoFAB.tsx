'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string; attachmentNames?: string[] }
type Attachment = { type: 'image' | 'document'; data: string; mediaType: string; name: string; previewUrl?: string; isVideo?: boolean }

const SUGGESTIONS = [
  'O que comer antes de treinar?',
  'Como calcular minhas proteínas?',
  'Sugestão de café da manhã saudável',
]

const RobotIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V5" />
    <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5h15A1.5 1.5 0 0121 6.5v10A1.5 1.5 0 0119.5 18h-15A1.5 1.5 0 013 16.5v-10A1.5 1.5 0 014.5 5z" />
    <rect x="7.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.8} />
    <rect x="13.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.8} />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.5h6" />
    <path strokeLinecap="round" d="M3 11H1.5M22.5 11H21" />
  </svg>
)

export function ProteinoFAB({ userId: _userId }: { userId?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function extractVideoFrame(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      const url = URL.createObjectURL(file)
      video.src = url
      video.onloadedmetadata = () => { video.currentTime = Math.min(1, video.duration / 2) }
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        const maxW = 1280
        canvas.width = Math.min(video.videoWidth, maxW)
        canvas.height = Math.round((video.videoHeight / video.videoWidth) * canvas.width)
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      video.onerror = reject
    })
  }

  function readFileAsAttachment(file: File): Promise<Attachment | null> {
    const isVideo = file.type.startsWith('video/')
    const isPdf = file.type === 'application/pdf'
    const maxSize = isPdf ? 20 * 1024 * 1024 : isVideo ? 500 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`${file.name}: muito grande (máx. ${isPdf ? '20MB' : isVideo ? '500MB' : '5MB'}).`)
      return Promise.resolve(null)
    }
    if (isVideo) {
      return extractVideoFrame(file).then(frameDataUrl => ({
        type: 'image' as const,
        data: frameDataUrl.split(',')[1],
        mediaType: 'image/jpeg',
        name: file.name,
        previewUrl: frameDataUrl,
        isVideo: true,
      })).catch(() => null)
    }
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const isImage = file.type.startsWith('image/')
        resolve({
          type: isImage ? 'image' : 'document',
          data: dataUrl.split(',')[1],
          mediaType: file.type || 'image/jpeg',
          name: file.name,
          previewUrl: isImage ? dataUrl : undefined,
        })
      }
      reader.readAsDataURL(file)
    })
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    const results = await Promise.all(files.map(readFileAsAttachment))
    const valid = results.filter(Boolean) as Attachment[]
    if (valid.length) setAttachments(prev => [...prev, ...valid])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  function removeAttachment(i: number) {
    setAttachments(prev => prev.filter((_, idx) => idx !== i))
  }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechAPI) {
      alert('Reconhecimento de voz não suportado neste navegador. Tente Chrome ou Safari.')
      return
    }
    const recognition = new SpeechAPI()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  async function sendMessage(text: string) {
    if ((!text.trim() && attachments.length === 0) || streaming) return
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const hasImages = attachments.some(a => a.type === 'image')
    const userMsg: Message = {
      role: 'user',
      content: text || (hasImages ? 'O que você vê nessas imagens?' : 'Analise estes documentos.'),
      attachmentNames: attachments.length > 0 ? attachments.map(a => a.name) : undefined,
    }
    const currentAttachments = attachments
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setAttachments([])
    setStreaming(true)

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: null,
          message: text,
          history,
          attachments: currentAttachments.map(a => ({ type: a.type, data: a.data, mediaType: a.mediaType })),
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Ocorreu um erro. Tente novamente.' }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Abrir Proteíno"
          className="w-12 h-12 rounded-full text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ backgroundColor: '#b48840' }}
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <RobotIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Side Panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setOpen(false)} />

          <div className="fixed right-0 top-0 bottom-0 w-full sm:right-4 sm:top-4 sm:bottom-4 sm:w-[380px] bg-white dark:bg-[#0d1020] z-50 flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-[#1e2030] shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#b48840' }}>
                <RobotIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Proteíno</p>
                <p className="text-xs text-gray-400">Assistente de nutrição</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center pt-8 px-2">
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: '#f5efe3' }}>
                    <RobotIcon className="w-7 h-7" style={{ color: '#b48840' } as React.CSSProperties} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Olá! Sou o Proteíno</p>
                  <p className="text-xs text-gray-400 mt-1 mb-5">Seu assistente de nutrição. Como posso ajudar?</p>
                  <div className="flex flex-col gap-2 text-left">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#b48840] hover:text-[#7a5c10] dark:hover:text-[#b48840] transition text-left">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' ? 'text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-[#1a1f35] text-gray-800 dark:text-gray-200 rounded-tl-sm'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: '#b48840' } : undefined}
                  >
                    {msg.attachmentNames && msg.attachmentNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {msg.attachmentNames.map((name, ni) => (
                          <div key={ni} className="flex items-center gap-1 opacity-80">
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                            </svg>
                            <span className="text-[11px] truncate max-w-[130px]">{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.content || (
                      <span className="flex gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1e2030] shrink-0">
              {/* Preview dos anexos */}
              {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative shrink-0">
                      {att.previewUrl ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={att.previewUrl} alt="" className="w-full h-full object-cover" />
                          {att.isVideo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/20 border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center gap-0.5 px-1">
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate w-full text-center px-0.5">PDF</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(i)}
                        className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full flex items-center justify-center"
                        style={{ width: '18px', height: '18px' }}
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inputs ocultos */}
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={handleFileChange} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleCameraChange} className="hidden" />

              <div className="flex gap-1.5 items-end">
                {/* Anexar */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={streaming}
                  className="w-9 h-9 shrink-0 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 flex items-center justify-center transition disabled:opacity-40"
                  title="Anexar imagens ou PDF"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>

                {/* Câmera */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={streaming}
                  className="w-9 h-9 shrink-0 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 flex items-center justify-center transition disabled:opacity-40"
                  title="Tirar foto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte algo..."
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1f35] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60"
                  style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                />

                {/* Microfone */}
                <button
                  onClick={toggleRecording}
                  disabled={streaming}
                  className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center transition disabled:opacity-40 ${
                    isRecording
                      ? 'border-red-400 text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
                      : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>

                {/* Enviar */}
                <button
                  onClick={() => sendMessage(input)}
                  disabled={(!input.trim() && attachments.length === 0) || streaming}
                  className="w-9 h-9 shrink-0 rounded-xl text-white flex items-center justify-center transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#b48840' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">Enter para enviar · Shift+Enter nova linha</p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
