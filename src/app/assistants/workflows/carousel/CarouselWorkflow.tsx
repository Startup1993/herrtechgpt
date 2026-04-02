'use client'

import { useState, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TitleSlide { type: 'title'; headline: string; subtitle: string }
interface ContentSlide { type: 'content'; headline: string; bullets: string[] }
interface CtaSlide { type: 'cta'; headline: string; cta: string; handle: string }
type Slide = TitleSlide | ContentSlide | CtaSlide

interface CarouselData { slides: Slide[] }

interface CISettings {
  primaryColor: string
  bgColor: string
  textColor: string
  accentColor: string
  handle: string
  slideCount: number
}

// ─── Slide component (renders at 1080×1080 display size, scaled for preview) ─

function SlideView({ slide, ci, index, total }: {
  slide: Slide
  ci: CISettings
  index: number
  total: number
}) {
  const base = 'w-[540px] h-[540px] flex flex-col relative overflow-hidden shrink-0'

  if (slide.type === 'title') {
    return (
      <div
        className={base}
        style={{ background: ci.bgColor, color: ci.textColor }}
        data-slide
      >
        {/* Accent bar top */}
        <div className="h-2 w-full" style={{ background: ci.primaryColor }} />
        <div className="flex-1 flex flex-col justify-center px-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4 opacity-50" style={{ color: ci.primaryColor }}>
            {index + 1} / {total}
          </p>
          <h1
            className="font-bold leading-tight mb-4"
            style={{ fontSize: '2.4rem', color: ci.textColor }}
          >
            {slide.headline}
          </h1>
          <p className="text-base leading-relaxed opacity-70" style={{ color: ci.textColor }}>
            {slide.subtitle}
          </p>
        </div>
        {/* Accent bar bottom */}
        <div className="h-1 w-1/3 ml-12 mb-8 rounded-full" style={{ background: ci.primaryColor }} />
        {ci.handle && (
          <p className="absolute bottom-4 right-8 text-xs opacity-40" style={{ color: ci.textColor }}>
            @{ci.handle}
          </p>
        )}
      </div>
    )
  }

  if (slide.type === 'content') {
    return (
      <div
        className={base}
        style={{ background: ci.bgColor, color: ci.textColor }}
        data-slide
      >
        <div className="h-1.5 w-full" style={{ background: ci.primaryColor }} />
        <div className="flex-1 flex flex-col justify-center px-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3 opacity-40" style={{ color: ci.primaryColor }}>
            {index + 1} / {total}
          </p>
          <h2
            className="font-bold leading-snug mb-6"
            style={{ fontSize: '1.6rem', color: ci.textColor }}
          >
            {slide.headline}
          </h2>
          <ul className="space-y-3">
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1 w-2 h-2 rounded-full shrink-0"
                  style={{ background: ci.primaryColor }}
                />
                <span className="text-base leading-snug opacity-85" style={{ color: ci.textColor }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {ci.handle && (
          <p className="absolute bottom-4 right-8 text-xs opacity-30" style={{ color: ci.textColor }}>
            @{ci.handle}
          </p>
        )}
      </div>
    )
  }

  // CTA
  return (
    <div
      className={base}
      style={{ background: ci.primaryColor }}
      data-slide
    >
      <div className="flex-1 flex flex-col justify-center items-center text-center px-12">
        <p className="text-xs font-semibold tracking-widest uppercase mb-6 opacity-60" style={{ color: ci.bgColor }}>
          {index + 1} / {total}
        </p>
        <h2
          className="font-bold leading-tight mb-6"
          style={{ fontSize: '2rem', color: ci.bgColor }}
        >
          {slide.headline}
        </h2>
        <div
          className="px-6 py-3 rounded-full font-semibold text-sm"
          style={{ background: ci.bgColor, color: ci.primaryColor }}
        >
          {slide.cta}
        </div>
        {ci.handle && (
          <p className="mt-8 text-sm font-semibold opacity-70" style={{ color: ci.bgColor }}>
            @{ci.handle}
          </p>
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
    accentColor: '#7c3aed',
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
      const data: CarouselData = await res.json()
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
        setProgress(`Slide ${i + 1} von ${slideEls.length} wird gerendert...`)
        const el = slideEls[i] as HTMLElement

        const canvas = await html2canvas(el, {
          scale: 2, // 540×540 × 2 = 1080×1080px
          useCORS: true,
          backgroundColor: null,
          logging: false,
        })

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png', 1.0)
        })

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
      setStep('done')
    } catch (err) {
      console.error(err)
      alert('Export fehlgeschlagen. Bitte nochmal versuchen.')
    } finally {
      setExporting(false)
      setProgress('')
    }
  }, [slides])

  // ── Input Step ──────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">🎠 Karussell-Generator</h1>
          <p className="text-muted text-sm">Blogpost oder Text rein — fertige Instagram-Slides raus</p>
        </div>

        {/* Blog post input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Dein Text / Blogpost
          </label>
          <textarea
            value={blogPost}
            onChange={(e) => setBlogPost(e.target.value)}
            placeholder="Füge hier deinen Blogpost, LinkedIn-Artikel oder Text ein..."
            rows={10}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* CI Settings */}
        <div className="mb-6 p-5 border border-border rounded-xl bg-surface-secondary space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Corporate Identity</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">Primärfarbe (Akzent)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={ci.primaryColor}
                  onChange={(e) => setCi(p => ({ ...p, primaryColor: e.target.value, accentColor: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-xs text-muted font-mono">{ci.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Hintergrundfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={ci.bgColor}
                  onChange={(e) => setCi(p => ({ ...p, bgColor: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-xs text-muted font-mono">{ci.bgColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Textfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={ci.textColor}
                  onChange={(e) => setCi(p => ({ ...p, textColor: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-xs text-muted font-mono">{ci.textColor}</span>
              </div>
            </div>
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
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Anzahl Slides: {ci.slideCount}</label>
            <input
              type="range"
              min={4}
              max={10}
              value={ci.slideCount}
              onChange={(e) => setCi(p => ({ ...p, slideCount: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted mt-0.5">
              <span>4</span><span>10</span>
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !blogPost.trim()}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {progress || 'Generiert...'}
            </>
          ) : '🎠 Karussell generieren'}
        </button>
      </div>
    )
  }

  // ── Preview Step ────────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Vorschau</h1>
            <p className="text-sm text-muted">{slides.length} Slides • 1080×1080px</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-secondary transition"
            >
              ← Zurück
            </button>
            <button
              onClick={exportSlides}
              disabled={exporting}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {progress}
                </>
              ) : '⬇ ZIP downloaden'}
            </button>
          </div>
        </div>

        {/* Active slide preview */}
        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
            <SlideView
              slide={slides[activeSlide]}
              ci={ci}
              index={activeSlide}
              total={slides.length}
            />
          </div>
        </div>

        {/* Slide thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`shrink-0 w-12 h-12 rounded-lg border-2 text-xs font-semibold transition ${
                i === activeSlide
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-border text-muted hover:border-primary/40'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Hidden render container for html2canvas */}
        <div className="sr-only" aria-hidden="true">
          <div ref={slidesContainerRef} className="flex flex-col gap-0">
            {slides.map((slide, i) => (
              <SlideView key={i} slide={slide} ci={ci} index={i} total={slides.length} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Done Step ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Download gestartet!</h1>
      <p className="text-muted mb-8">
        Dein ZIP mit {slides.length} fertigen Slides (1080×1080px) wurde heruntergeladen.<br />
        Direkt auf Instagram, LinkedIn oder wo du willst posten.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setStep('input'); setSlides([]); setBlogPost('') }}
          className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition"
        >
          Neues Karussell erstellen
        </button>
        <button
          onClick={() => setStep('preview')}
          className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-surface-secondary transition"
        >
          Nochmal herunterladen
        </button>
      </div>
    </div>
  )
}
