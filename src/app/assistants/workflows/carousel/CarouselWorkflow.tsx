'use client'

import { useState, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TitleSlide { type: 'title'; headline: string; subtitle: string }
interface ContentSlide { type: 'content'; headline: string; bullets: string[] }
interface CtaSlide { type: 'cta'; headline: string; cta: string; handle: string }
type Slide = TitleSlide | ContentSlide | CtaSlide

interface CISettings {
  primaryColor: string
  bgColor: string
  textColor: string
  handle: string
  slideCount: number
}

type CIMode = 'manual' | 'text' | 'image'

// ─── Color extraction from image ─────────────────────────────────────────────

async function extractColorsFromImage(file: File): Promise<{ primary: string; bg: string; text: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 80
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)
      const data = ctx.getImageData(0, 0, size, size).data

      const colorMap: Record<string, number> = {}
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]
        if (a < 128) continue
        const r = Math.round(data[i] / 24) * 24
        const g = Math.round(data[i + 1] / 24) * 24
        const b = Math.round(data[i + 2] / 24) * 24
        // skip near-white and near-black for primary
        if (r > 235 && g > 235 && b > 235) continue
        if (r < 20 && g < 20 && b < 20) continue
        const key = `${r},${g},${b}`
        colorMap[key] = (colorMap[key] || 0) + 1
      }

      const sorted = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => {
          const [r, g, b] = key.split(',').map(Number)
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        })

      URL.revokeObjectURL(url)
      resolve({
        primary: sorted[0] ?? '#7c3aed',
        bg: '#ffffff',
        text: '#111111',
      })
    }
    img.src = url
  })
}

// ─── Slide component ──────────────────────────────────────────────────────────

function SlideView({ slide, ci, index, total }: {
  slide: Slide; ci: CISettings; index: number; total: number
}) {
  const base = 'flex flex-col relative shrink-0'

  if (slide.type === 'title') {
    return (
      <div className={base} style={{ width: 540, height: 540, overflow: 'hidden', background: ci.bgColor, color: ci.textColor }} data-slide>
        <div style={{ height: 8, width: '100%', background: ci.primaryColor }} />
        <div className="flex-1 flex flex-col justify-center px-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4 opacity-50" style={{ color: ci.primaryColor }}>
            {index + 1} / {total}
          </p>
          <h1 className="font-bold leading-tight mb-4" style={{ fontSize: '2.4rem', color: ci.textColor }}>
            {slide.headline}
          </h1>
          <p className="text-base leading-relaxed opacity-70" style={{ color: ci.textColor }}>
            {slide.subtitle}
          </p>
        </div>
        <div className="h-1 w-1/3 ml-12 mb-8 rounded-full" style={{ background: ci.primaryColor }} />
        {ci.handle && (
          <p className="absolute bottom-4 right-8 text-xs opacity-40" style={{ color: ci.textColor }}>@{ci.handle}</p>
        )}
      </div>
    )
  }

  if (slide.type === 'content') {
    return (
      <div className={base} style={{ width: 540, height: 540, overflow: 'hidden', background: ci.bgColor, color: ci.textColor }} data-slide>
        <div style={{ height: 6, width: '100%', background: ci.primaryColor }} />
        <div className="flex-1 flex flex-col justify-center px-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3 opacity-40" style={{ color: ci.primaryColor }}>
            {index + 1} / {total}
          </p>
          <h2 className="font-bold leading-snug mb-6" style={{ fontSize: '1.6rem', color: ci.textColor }}>
            {slide.headline}
          </h2>
          <ul className="space-y-3">
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: ci.primaryColor }} />
                <span className="text-base leading-snug opacity-85" style={{ color: ci.textColor }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        {ci.handle && (
          <p className="absolute bottom-4 right-8 text-xs opacity-30" style={{ color: ci.textColor }}>@{ci.handle}</p>
        )}
      </div>
    )
  }

  return (
    <div className={base} style={{ width: 540, height: 540, overflow: 'hidden', background: ci.primaryColor }} data-slide>
      <div className="flex-1 flex flex-col justify-center items-center text-center px-12">
        <p className="text-xs font-semibold tracking-widest uppercase mb-6 opacity-60" style={{ color: ci.bgColor }}>
          {index + 1} / {total}
        </p>
        <h2 className="font-bold leading-tight mb-6" style={{ fontSize: '2rem', color: ci.bgColor }}>
          {slide.headline}
        </h2>
        <div className="px-6 py-3 rounded-full font-semibold text-sm" style={{ background: ci.bgColor, color: ci.primaryColor }}>
          {slide.cta}
        </div>
        {ci.handle && (
          <p className="mt-8 text-sm font-semibold opacity-70" style={{ color: ci.bgColor }}>@{ci.handle}</p>
        )}
      </div>
    </div>
  )
}

// ─── CI Section ───────────────────────────────────────────────────────────────

function CISection({ ci, setCi }: { ci: CISettings; setCi: React.Dispatch<React.SetStateAction<CISettings>> }) {
  const [mode, setMode] = useState<CIMode>('manual')
  const [ciText, setCiText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(async (file: File) => {
    setExtracting(true)
    setImagePreview(URL.createObjectURL(file))
    try {
      const colors = await extractColorsFromImage(file)
      setCi(p => ({ ...p, primaryColor: colors.primary, bgColor: colors.bg, textColor: colors.text }))
    } finally {
      setExtracting(false)
    }
  }, [setCi])

  const applyAiColors = useCallback(async () => {
    if (!ciText.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/carousel/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: ciText }),
      })
      const data = await res.json()
      if (data.primaryColor) setCi(p => ({ ...p, ...data }))
    } finally {
      setAiLoading(false)
    }
  }, [ciText, setCi])

  const tabs: { id: CIMode; label: string; icon: string }[] = [
    { id: 'manual', label: 'Manuell', icon: '🎨' },
    { id: 'text', label: 'Beschreiben', icon: '✍️' },
    { id: 'image', label: 'Logo / Bild', icon: '🖼️' },
  ]

  return (
    <div className="mb-6 border border-border rounded-xl overflow-hidden bg-surface-secondary">
      <div className="p-5 pb-0">
        <h3 className="text-sm font-semibold text-foreground mb-3">Corporate Identity</h3>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                mode === t.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-surface hover:text-foreground'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Manual mode */}
        {mode === 'manual' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">Primärfarbe</label>
              <div className="flex items-center gap-2">
                <input type="color" value={ci.primaryColor}
                  onChange={(e) => setCi(p => ({ ...p, primaryColor: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer" />
                <span className="text-xs text-muted font-mono">{ci.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Hintergrund</label>
              <div className="flex items-center gap-2">
                <input type="color" value={ci.bgColor}
                  onChange={(e) => setCi(p => ({ ...p, bgColor: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer" />
                <span className="text-xs text-muted font-mono">{ci.bgColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Textfarbe</label>
              <div className="flex items-center gap-2">
                <input type="color" value={ci.textColor}
                  onChange={(e) => setCi(p => ({ ...p, textColor: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer" />
                <span className="text-xs text-muted font-mono">{ci.textColor}</span>
              </div>
            </div>
            <div>
              {/* color preview */}
              <label className="block text-xs text-muted mb-1.5">Vorschau</label>
              <div className="flex gap-1.5 mt-1">
                <div className="w-9 h-9 rounded-lg border border-black/10" style={{ background: ci.primaryColor }} />
                <div className="w-9 h-9 rounded-lg border border-black/10" style={{ background: ci.bgColor }} />
                <div className="w-9 h-9 rounded-lg border border-black/10" style={{ background: ci.textColor }} />
              </div>
            </div>
          </div>
        )}

        {/* Text mode */}
        {mode === 'text' && (
          <div className="space-y-3">
            <textarea
              value={ciText}
              onChange={(e) => setCiText(e.target.value)}
              placeholder="z.B. &quot;Meine Marke ist modern und minimalistisch. Primärfarbe ist ein kräftiges Lila, weißer Hintergrund, dunkler Text.&quot;"
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <button
              onClick={applyAiColors}
              disabled={aiLoading || !ciText.trim()}
              className="w-full py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg> Farben werden analysiert...</>
              ) : '✨ Farben automatisch setzen'}
            </button>
            {/* Show current colors */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>Aktuell:</span>
              <div className="w-5 h-5 rounded" style={{ background: ci.primaryColor }} />
              <span className="font-mono">{ci.primaryColor}</span>
              <div className="w-5 h-5 rounded border border-black/10" style={{ background: ci.bgColor }} />
              <div className="w-5 h-5 rounded" style={{ background: ci.textColor }} />
            </div>
          </div>
        )}

        {/* Image mode */}
        {mode === 'image' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl py-6 text-center hover:border-primary/40 hover:bg-surface transition"
            >
              {imagePreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={imagePreview} alt="Logo" className="h-16 object-contain rounded" />
                  <span className="text-xs text-muted">Anderes Bild wählen</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">🖼️</span>
                  <span className="text-sm text-muted">Logo oder Marken-Bild hochladen</span>
                  <span className="text-xs text-muted opacity-60">PNG, JPG, SVG</span>
                </div>
              )}
            </button>
            {extracting && (
              <p className="text-xs text-center text-muted animate-pulse">Farben werden extrahiert...</p>
            )}
            {!extracting && imagePreview && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Erkannte Farben:</span>
                <div className="w-5 h-5 rounded" style={{ background: ci.primaryColor }} />
                <span className="font-mono">{ci.primaryColor}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CarouselWorkflow() {
  const [step, setStep] = useState<'input' | 'preview' | 'done'>('input')
  const [blogPost, setBlogPost] = useState('')
  const [ci, setCi] = useState<CISettings>({
    primaryColor: '#7c3aed',
    bgColor: '#ffffff',
    textColor: '#111111',
    handle: '',
    slideCount: 7,
  })
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const slidesContainerRef = useRef<HTMLDivElement>(null)

  const generate = useCallback(async () => {
    if (!blogPost.trim()) return
    setLoading(true)
    setProgress('KI analysiert deinen Text...')
    try {
      const res = await fetch('/api/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPost, slideCount: ci.slideCount, handle: ci.handle }),
      })
      const data = await res.json()
      setSlides(data.slides)
      setActiveSlide(0)
      setStep('preview')
    } catch {
      alert('Fehler beim Generieren. Bitte nochmal versuchen.')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [blogPost, ci.slideCount, ci.handle])

  const exportSlides = useCallback(async () => {
    if (!slides.length) return
    setExporting(true)
    setProgress('Slides werden exportiert...')
    try {
      const html2canvas = (await import('html2canvas')).default
      const JSZip = (await import('jszip')).default
      const container = slidesContainerRef.current
      if (!container) return
      const slideEls = container.querySelectorAll('[data-slide]')
      const zip = new JSZip()
      for (let i = 0; i < slideEls.length; i++) {
        setProgress(`Slide ${i + 1} von ${slideEls.length}...`)
        const canvas = await html2canvas(slideEls[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        })
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png', 1.0))
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, blob)
      }
      setProgress('ZIP wird erstellt...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'karussell.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Export fehlgeschlagen.')
    } finally {
      setExporting(false)
      setProgress('')
    }
  }, [slides])

  // ── Input Step ──────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className="max-w-2xl mx-auto px-8 pt-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">🎠 Karussell-Generator</h1>
          <p className="text-muted text-sm">Blogpost oder Text rein — fertige Instagram-Slides raus</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Dein Text / Blogpost</label>
          <textarea
            value={blogPost}
            onChange={(e) => setBlogPost(e.target.value)}
            placeholder="Füge hier deinen Blogpost, LinkedIn-Artikel oder Text ein..."
            rows={10}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <CISection ci={ci} setCi={setCi} />

        {/* Handle + Slides */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs text-muted mb-1.5">Instagram Handle</label>
            <input
              type="text"
              value={ci.handle}
              onChange={(e) => setCi(p => ({ ...p, handle: e.target.value.replace('@', '') }))}
              placeholder="deinname"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Anzahl Slides: {ci.slideCount}</label>
            <input
              type="range" min={4} max={10} value={ci.slideCount}
              onChange={(e) => setCi(p => ({ ...p, slideCount: Number(e.target.value) }))}
              className="w-full mt-2 accent-primary"
            />
            <div className="flex justify-between text-xs text-muted mt-0.5"><span>4</span><span>10</span></div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !blogPost.trim()}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>{progress || 'Generiert...'}</>
          ) : '🎠 Karussell generieren'}
        </button>
      </div>
    )
  }

  // ── Preview Step ────────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className="max-w-3xl mx-auto px-8 pt-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Vorschau</h1>
            <p className="text-sm text-muted">{slides.length} Slides · 1080×1080px</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('input')} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-secondary transition">
              ← Zurück
            </button>
            <button
              onClick={exportSlides} disabled={exporting}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {exporting ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>{progress}</>
              ) : '⬇ ZIP downloaden'}
            </button>
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
            <SlideView slide={slides[activeSlide]} ci={ci} index={activeSlide} total={slides.length} />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setActiveSlide(i)}
              className={`shrink-0 w-12 h-12 rounded-lg border-2 text-xs font-semibold transition ${
                i === activeSlide ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted hover:border-primary/40'
              }`}
            >{i + 1}</button>
          ))}
        </div>

        {/* Off-screen render container — full size so html2canvas works correctly */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
          <div ref={slidesContainerRef} style={{ display: 'flex', flexDirection: 'column' }}>
            {slides.map((slide, i) => (
              <SlideView key={i} slide={slide} ci={ci} index={i} total={slides.length} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Download gestartet!</h1>
      <p className="text-muted mb-8">
        {slides.length} Slides (1080×1080px) als ZIP heruntergeladen.<br />Direkt auf Instagram posten.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setStep('input'); setSlides([]); setBlogPost('') }}
          className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition">
          Neues Karussell erstellen
        </button>
        <button onClick={() => setStep('preview')}
          className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-surface-secondary transition">
          Nochmal herunterladen
        </button>
      </div>
    </div>
  )
}
