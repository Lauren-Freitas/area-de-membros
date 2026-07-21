'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useState } from 'react'

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition ${active ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [htmlMode, setHtmlMode] = useState(false)
  const [html, setHtml] = useState(defaultValue ?? '')

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
    content: defaultValue ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[160px] px-4 py-3 focus:outline-none',
      },
    },
  })

  function toggleHtmlMode() {
    if (htmlMode) {
      editor?.commands.setContent(html)
    } else {
      setHtml(editor?.getHTML() ?? '')
    }
    setHtmlMode(!htmlMode)
  }

  if (!editor) return null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 px-2 py-1.5 flex-wrap">
        <ToolbarButton title="Negrito" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>N</strong>
        </ToolbarButton>
        <ToolbarButton title="Lista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • Lista
        </ToolbarButton>
        <ToolbarButton title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. Lista
        </ToolbarButton>
        <ToolbarButton
          title="Link"
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL do link:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
        >
          Link
        </ToolbarButton>
        <ToolbarButton
          title="Imagem por URL"
          onClick={() => {
            const url = window.prompt('URL da imagem:')
            if (url) editor.chain().focus().setImage({ src: url }).run()
          }}
        >
          Imagem
        </ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton title="Editar HTML direto" active={htmlMode} onClick={toggleHtmlMode}>
          HTML
        </ToolbarButton>
      </div>

      {htmlMode ? (
        <textarea
          value={html}
          onChange={e => setHtml(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 text-sm font-mono resize-y focus:outline-none"
          placeholder="<p>Escreva HTML direto aqui...</p>"
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <input type="hidden" name={name} value={html} readOnly />
    </div>
  )
}
