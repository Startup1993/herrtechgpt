'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scrolling waveform UI for voice dictation.
 * Manages its own bar count (via ResizeObserver) and animation loop.
 * Reads live audio levels from analyserRef.current if available,
 * otherwise shows a subtle idle animation.
 */
export function VoiceRecordingUI({
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

  // Animation loop — reads from analyserRef every 75ms, scrolls right→left
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
        {/* Scrolling waveform — fills full width, bars flow right→left */}
        <div ref={containerRef} className="flex-1 flex items-end gap-[2px] h-10 overflow-hidden">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-[2px] rounded-full bg-foreground/70 flex-shrink-0"
              style={{ height: `${h}px`, transition: 'height 0.07s ease' }}
            />
          ))}
        </div>
        {/* Cancel — discard transcription */}
        <button
          onPointerDown={(e) => { e.preventDefault(); onCancel() }}
          className="p-2 rounded-lg hover:bg-surface-secondary text-foreground/60 hover:text-foreground transition-colors shrink-0"
          title="Abbrechen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* Confirm — stop recording, keep text in input for editing */}
        <button
          onPointerDown={(e) => { e.preventDefault(); onConfirm() }}
          className="p-2 rounded-lg hover:bg-surface-secondary text-foreground/60 hover:text-foreground transition-colors shrink-0"
          title="Übernehmen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
