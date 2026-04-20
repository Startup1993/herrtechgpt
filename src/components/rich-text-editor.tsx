'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { useRef, useEffect } from 'react'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Image as ImageIcon, Loader2,
  Undo, Redo, Code,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 240 }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-[var(--radius-md)] max-w-full h-auto my-2 border border-border' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Beschreibung hier eingeben...',
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const md = (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
      onChange(md)
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none px-4 py-3',
        style: `min-height: ${minHeight}px`,
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) uploadImage(file).then((url) => {
              if (url && editor) editor.chain().focus().setImage({ src: url }).run()
            })
            return true
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
    if (value !== current) {
      editor.commands.setContent(value ?? '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/admin/upload-image', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Upload fehlgeschlagen')
      return null
    }
    return data.url as string
  }

  const handleFilePick = async (file: File) => {
    const url = await uploadImage(file)
    if (url && editor) editor.chain().focus().setImage({ src: url }).run()
  }

  const insertLink = () => {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link-URL:', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div className="border border-border rounded-[var(--radius-md)] bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
      <Toolbar editor={editor} onInsertImage={() => fileInputRef.current?.click()} onInsertLink={insertLink} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFilePick(f)
          e.target.value = ''
        }}
      />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({
  editor,
  onInsertImage,
  onInsertLink,
}: {
  editor: Editor
  onInsertImage: () => void
  onInsertLink: () => void
}) {
  const Btn = ({
    onClick,
    active,
    disabled,
    title,
    children,
  }: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-[var(--radius-sm)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? 'bg-primary/15 text-primary' : 'text-muted hover:text-foreground hover:bg-surface-hover'
      }`}
    >
      {children}
    </button>
  )

  const Sep = () => <span className="w-px h-5 bg-border mx-0.5" />

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface-secondary">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Fett (Cmd+B)">
        <Bold size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kursiv (Cmd+I)">
        <Italic size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline-Code">
        <Code size={14} />
      </Btn>
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Überschrift 2">
        <Heading2 size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Überschrift 3">
        <Heading3 size={14} />
      </Btn>
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Aufzählung">
        <List size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Nummerierte Liste">
        <ListOrdered size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Zitat">
        <Quote size={14} />
      </Btn>
      <Sep />
      <Btn onClick={onInsertLink} active={editor.isActive('link')} title="Link einfügen">
        <LinkIcon size={14} />
      </Btn>
      <Btn onClick={onInsertImage} title="Bild hochladen">
        <ImageIcon size={14} />
      </Btn>
      <Sep />
      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Rückgängig (Cmd+Z)">
        <Undo size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Wiederherstellen">
        <Redo size={14} />
      </Btn>
    </div>
  )
}
