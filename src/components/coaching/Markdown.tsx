'use client'

import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

/** Einheitliche Markdown-Darstellung für Zusammenfassungen, Anleitungen, Notizen. */
export function Markdown({ text, className = '' }: { text: string | null | undefined; className?: string }) {
  if (!text || !text.trim()) return null
  return (
    <div className={`prose-editor text-sm ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{text}</ReactMarkdown>
    </div>
  )
}
