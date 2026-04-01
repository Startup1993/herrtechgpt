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
      // Mic denied — VoiceRecordingUI shows idle animation (analyserRef stays null)
    }
  }, [])

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
        onTranscript(finalTranscript)
      }
    }

    recognition.onerror = () => { setIsListening(false); stopAudioAnalysis() }
    recognition.onend = () => { stopAudioAnalysis(); setIsListening(false); onStop?.() }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    startAudioAnalysis()
  }, [isListening, startAudioAnalysis, stopAudioAnalysis, onTranscript, onStop])

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
