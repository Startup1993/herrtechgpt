'use client'

import { useCallback, useRef, useState } from 'react'

interface UseVoiceDictationOptions {
  onTranscript: (text: string) => void
  onCancel?: () => void
  onStop?: () => void
}

/**
 * Hook for voice dictation using Web Speech API + Web Audio API.
 * - toggleDictation: start / stop recording
 * - cancelDictation: stop + discard transcription
 * - confirmDictation: stop + keep transcription in input (no auto-send)
 * - analyserRef: pass to VoiceRecordingUI for live waveform
 * - isListening: whether recording is active
 */
export function useVoiceDictation({ onTranscript, onCancel, onStop }: UseVoiceDictationOptions) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  const stopAudioAnalysis = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop())
    audioStreamRef.current = null
    const ctx = audioCtxRef.current
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => { /* ignore already-closed */ })
    }
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  const toggleDictation = useCallback(async () => {
    if (isListening) {
      recognitionRef.current?.stop()
      stopAudioAnalysis()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt. Bitte nutze Chrome, Edge oder Safari.')
      return
    }

    // HTTPS/localhost is required for getUserMedia + SpeechRecognition
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      alert('Sprachsteuerung braucht eine sichere Verbindung (HTTPS). Aktuell läuft die Seite unverschlüsselt.')
      return
    }

    // Pre-flight: explicit mic permission request with readable error
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
    } catch (err) {
      const name = (err as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        alert('Mikrofon-Zugriff wurde blockiert. Bitte erlaube das Mikrofon in den Browser-Einstellungen (🔒 Schloss-Symbol neben der URL → Mikrofon zulassen).')
      } else if (name === 'NotFoundError') {
        alert('Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an oder prüfe die Audio-Einstellungen.')
      } else {
        alert(`Mikrofon konnte nicht gestartet werden: ${name ?? 'Unbekannter Fehler'}`)
      }
      stopAudioAnalysis()
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
        onTranscript(finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorType = event.error
      console.error('[VoiceDictation] recognition error:', errorType, event.message)
      setIsListening(false)
      stopAudioAnalysis()
      // Show feedback for the common non-trivial errors
      if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
        alert('Spracherkennung wurde vom Browser blockiert. Bitte Mikrofon-Rechte im 🔒-Menü freigeben.')
      } else if (errorType === 'network') {
        alert('Spracherkennung braucht Internet-Verbindung (Google Speech). Bitte prüfe deine Verbindung.')
      } else if (errorType === 'audio-capture') {
        alert('Mikrofon konnte nicht aufgenommen werden. Anderes Tab/App könnte es blockieren.')
      }
      // 'no-speech' / 'aborted' / 'abort' ignore silently — normal stop
    }
    recognition.onend = () => { stopAudioAnalysis(); setIsListening(false); onStop?.() }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setIsListening(true)
    } catch (err) {
      console.error('[VoiceDictation] start failed:', err)
      stopAudioAnalysis()
      setIsListening(false)
      alert('Spracherkennung konnte nicht gestartet werden. Seite neu laden und erneut versuchen.')
    }
  }, [isListening, stopAudioAnalysis, onTranscript, onStop])

  const cancelDictation = useCallback(() => {
    recognitionRef.current?.stop()
    stopAudioAnalysis()
    setIsListening(false)
    onCancel?.()
  }, [stopAudioAnalysis, onCancel])

  const confirmDictation = useCallback(() => {
    recognitionRef.current?.stop()
    stopAudioAnalysis()
    setIsListening(false)
    // Text stays in input — user reviews and sends manually
  }, [stopAudioAnalysis])

  return {
    isListening,
    analyserRef,
    toggleDictation,
    cancelDictation,
    confirmDictation,
  }
}
