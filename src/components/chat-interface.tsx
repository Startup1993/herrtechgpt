'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChatMessage } from './chat-message'
import type { AgentDefinition } from '@/lib/agents'

interface ChatInterfaceProps {
  agent: AgentDefinition
  conversationId: string
  initialMessages: { id: string; role: 'user' | 'assistant'; content: string }[]
  autoSend?: string
}

export function ChatInterface({
  agent,
  conversationId,
  initialMessages,
  autoSend,
}: ChatInterfaceProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const autoSentRef = useRef(false)

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: '/api/chat',
        body: { agentId: agent.id, conversationId },
      }),
    [agent.id, conversationId]
  )

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      parts: [{ type: 'text' as const, text: msg.content }],
    })),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  // Auto-send first message (from AgentLanding)
  useEffect(() => {
    if (autoSend && !autoSentRef.current) {
      autoSentRef.current = true
      sendMessage({ text: autoSend })
      // Clean up the URL without reloading
      router.replace(`/assistants/${agent.id}/${conversationId}`)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text?: string) => {
    const messageText = text ?? input.trim()
    if (!messageText || isStreaming) return
    sendMessage({ text: messageText })
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Voice dictation
  const toggleDictation = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt. Bitte nutze Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'de-DE'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      if (finalTranscript) {
        setInput((prev) => prev + finalTranscript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])

  const showGoButton = agent.mode === 'guided' && messages.length === 0
  const isGeneralChat = agent.id === 'general'
  const showCenteredView = messages.length === 0

  // Extract text content from message parts
  const getMessageContent = (msg: (typeof messages)[0]): string => {
    if (typeof msg.content === 'string' && msg.content) return msg.content
    if (msg.parts) {
      return msg.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')
    }
    return ''
  }

  // Shared input bar component
  const renderInputBar = (centered?: boolean) => (
    <div className={centered ? 'w-full max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}>
      <div className="flex gap-2 items-end bg-surface border border-border rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-shadow">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={agent.placeholder}
          rows={1}
          className="flex-1 py-2 text-sm resize-none max-h-32 overflow-y-auto bg-transparent focus:outline-none placeholder:text-muted/60"
          style={{ minHeight: '36px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 128) + 'px'
          }}
        />
        <div className="flex items-center gap-1 pb-1">
          {/* Dictation button */}
          <button
            onClick={toggleDictation}
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-primary text-white animate-pulse'
                : 'text-muted hover:text-foreground hover:bg-surface-secondary'
            }`}
            title={isListening ? 'Diktat stoppen' : 'Spracheingabe'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          {/* Send button */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className="p-2 bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-white/50 text-white rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  // Centered empty state for general chat (ChatGPT-style)
  if (showCenteredView && isGeneralChat) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Was kann ich für dich tun?
          </h1>
          <p className="text-muted text-sm mb-10">
            Frag mich alles rund um Immobilien — ich helfe dir gerne.
          </p>
          {renderInputBar(true)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4">{agent.emoji}</div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {agent.name}
            </h2>
            <p className="text-sm text-muted max-w-md mb-6">
              {agent.description}
            </p>
            {showGoButton && (
              <button
                onClick={() =>
                  handleSend("Los geht's! Bitte starte den Prozess.")
                }
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors text-sm"
              >
                {agent.goButtonLabel ?? 'Starten'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => {
              const content = getMessageContent(msg)
              if (!content) return null
              return (
                <ChatMessage
                  key={msg.id}
                  role={msg.role as 'user' | 'assistant'}
                  content={content}
                />
              )
            })}
            {isStreaming &&
              messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-surface-secondary text-muted px-4 py-3 rounded-2xl rounded-bl-md text-sm">
                    Schreibt...
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-3 py-3 md:px-6 md:py-4 bg-surface">
        {renderInputBar()}
      </div>
    </div>
  )
}
