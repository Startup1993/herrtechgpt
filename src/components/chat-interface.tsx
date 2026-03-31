'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChatMessage } from './chat-message'
import type { AgentDefinition } from '@/lib/agents'

// VoiceRecordingUI manages its own bar count (via ResizeObserver) and animation
function VoiceRecordingUI({
  analyserRef,
  onCancel,
  onConfirm,
  centered,
}: {
  analyserRef: { current: AnalyserNode | null }
  onCancel: () => void
  onConfirm: () => void
  centered?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [barHeights, setBarHeights] = useState<number[]>(() => Array(60).fill(3))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dynamically set bar count to fill the container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      // 2px bar + 2px gap = 4px per bar
      const n = Math.max(20, Math.floor(w / 4))
      setBarHeights(Array(n).fill(3))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Animation loop — reads from analyserRef every 75ms
  useEffect(() => {
    const tick = () => {
      let h = 3
      const analyser = analyserRef.current
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const slice = data.slice(0, Math.floor(data.length / 3))
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length
        h = Math.max(3, (avg / 255) * 38)
      } else {
        h = 3 + Math.random() * 4
      }
      setBarHeights((prev) => (prev.length ? [...prev.slice(1), h] : prev))
      timerRef.current = setTimeout(tick, 75)
    }
    tick()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [analyserRef])

  return (
    <div className={centered ? 'w-full max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}>
      <div className="flex items-center gap-3 px-5 py-3.5 border border-dashed border-border rounded-2xl bg-surface shadow-sm">
        {/* Scrolling waveform — fills full width, bars flow right to left */}
        <div ref={containerRef} className="flex-1 flex items-end gap-[2px] h-10 overflow-hidden">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-[2px] rounded-full bg-foreground/70 flex-shrink-0"
              style={{ height: `${h}px`, transition: 'height 0.07s ease' }}
            />
          ))}
        </div>
        {/* Cancel */}
        <button
          onPointerDown={(e) => { e.preventDefault(); onCancel() }}
          className="p-2 rounded-lg hover:bg-surface-secondary text-foreground/60 hover:text-foreground transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* Confirm */}
        <button
          onPointerDown={(e) => { e.preventDefault(); onConfirm() }}
          className="p-2 rounded-lg hover:bg-surface-secondary text-foreground/60 hover:text-foreground transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

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
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
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

  // Set up audio stream + analyser node (animation runs inside VoiceRecordingUI)
  const stopAudioAnalysis = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.6
      analyserRef.current = analyser
      ctx.createMediaStreamSource(stream).connect(analyser)
    } catch {
      // mic denied — VoiceRecordingUI will use idle animation (analyserRef stays null)
    }
  }, [])

  // Voice dictation
  const toggleDictation = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      stopAudioAnalysis()
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
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        setInput((prev) => prev + finalTranscript)
      }
    }

    recognition.onerror = () => { setIsListening(false) }
    recognition.onend = () => { stopAudioAnalysis(); setIsListening(false) }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    startAudioAnalysis()
  }, [isListening, startAudioAnalysis, stopAudioAnalysis])

  const showGoButton = agent.mode === 'guided' && messages.length === 0
  const isGeneralChat = agent.id === 'general'
  const showCenteredView = messages.length === 0

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

  const cancelDictation = useCallback(() => {
    recognitionRef.current?.stop()
    stopAudioAnalysis()
    setIsListening(false)
    setInput('')
  }, [stopAudioAnalysis])

  const confirmDictation = useCallback(() => {
    recognitionRef.current?.stop()
    stopAudioAnalysis()
    setIsListening(false)
    // Text bleibt im Eingabefeld — Nutzer kann es prüfen/ergänzen, dann manuell senden
  }, [stopAudioAnalysis])

  // Shared input bar
  const renderInputBar = (centered?: boolean) => {
    if (isListening) return (
      <VoiceRecordingUI
        analyserRef={analyserRef}
        onCancel={cancelDictation}
        onConfirm={confirmDictation}
        centered={centered}
      />
    )
    return (
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
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
              title="Spracheingabe"
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
  }

  // Centered empty state for general chat
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
                onClick={() => handleSend("Los geht's! Bitte starte den Prozess.")}
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
                  agentId={agent.id}
                  agentName={agent.name}
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
