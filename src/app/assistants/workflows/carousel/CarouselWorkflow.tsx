'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TitleSlide { type: 'title'; headline: string; subtitle: string }
interface ContentSlide { type: 'content'; headline: string; bullets: string[] }
interface CtaSlide { type: 'cta'; headline: string; cta: string; handle: string }
type Slide = TitleSlide | ContentSlide | CtaSlide

interface CISettings {
  primaryColor: string
  bgColor: string
  textColor: string
  accentColor: string
  handle: string
  slideCount: number
  headlineFont: string
  bodyFont: string
  headlineFontWeight: string
  bodyFontWeight: string
  lineHeight: string
  letterSpacing: string
  spacious: boolean
}

type CIMode = 'manual' | 'text' | 'image'

const DEFAULT_CI: CISettings = {
  primaryColor: '#7c3aed',
  bgColor: '#ffffff',
  textColor: '#111111',
  accentColor: '#7c3aed',
  handle: '',
  slideCount: 7,
  headlineFont: 'Inter',
  bodyFont: 'Inter',
  headlineFontWeight: '700',
  bodyFontWeight: '400',
  lineHeight: '1.5',
  letterSpacing: '0em',
  spacious: false,
}

// ─── Load Google Fonts dynamically ───────────────────────────────────────────

function useGoogleFont(query: string) {
  useEffect(() => {
    if (!query) return
    const id = 'carousel-gfont'
    const existing = document.getElementById(id)
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`
    document.head.appendChild(link)
  }, [query])
}

// ─── Color extraction from image ─────────────────────────────────────────────

async function extractColorsFromImage(file: File): Promise<{ primary: string; bg: string; text: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 80
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)
      const data = ctx.getImageData(0, 0, size, size).data
      const colorMap: Record<string, number> = {}
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue
        const r = Math.round(data[i] / 24) * 24
        const g = Math.round(data[i + 1] / 24) * 24
        const b = Math.round(data[i + 2] / 24) * 24
        if (r > 235 && g > 235 && b > 235) continue
        if (r < 20 && g < 20 && b < 20) continue
        const key = `${r},${g},${b}`
        colorMap[key] = (colorMap[key] || 0) + 1
      }
      const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1])
        .map(([key]) => {
          const [r, g, b] = key.split(',').map(Number)
          return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
        })
      URL.revokeObjectURL(url)
      resolve({ primary: sorted[0] ?? '#7c3aed', bg: '#ffffff', text: '#111111' })
    }
    img.src = url
  })
}

// ─── Slide component ──────────────────────────────────────────────────────────

function SlideView({ slide, ci, index, total }: {
  slide: Slide; ci: CISettings; index: number; total: number
}) {
  const padding = ci.spacious ? 56 : 48
  const slideStyle: React.CSSProperties = {
    width: 540, height: 540, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', flexShrink: 0,
  }
  const counterStyle: React.CSSProperties = {
    fontSize: 11, fontFamily: ci.bodyFont, fontWeight: ci.bodyFontWeight,
    letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45, marginBottom: ci.spacious ? 24 : 16,
    color: slide.type === 'cta' ? ci.bgColor : ci.primaryColor,
  }
  const h1Style: React.CSSProperties = {
    fontFamily: ci.headlineFont, fontWeight: ci.headlineFontWeight, lineHeight: ci.lineHeight,
    letterSpacing: ci.letterSpacing, fontSize: '2.2rem', color: ci.textColor, marginBottom: ci.spacious ? 20 : 12,
    wordBreak: 'break-word',
  }
  const h2Style: React.CSSProperties = {
    fontFamily: ci.headlineFont, fontWeight: ci.headlineFontWeight, lineHeight: ci.lineHeight,
    letterSpacing: ci.letterSpacing, fontSize: '1.55rem', color: ci.textColor, marginBottom: ci.spacious ? 24 : 16,
    wordBreak: 'break-word',
  }
  const bodyStyle: React.CSSProperties = {
    fontFamily: ci.bodyFont, fontWeight: ci.bodyFontWeight, lineHeight: ci.lineHeight,
    letterSpacing: ci.letterSpacing, fontSize: '0.95rem', color: ci.textColor, opacity: 0.75,
    wordBreak: 'break-word',
  }

  if (slide.type === 'title') {
    return (
      <div style={{ ...slideStyle, background: ci.bgColor }} data-slide>
        <div style={{ height: 8, width: '100%', background: ci.primaryColor, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${padding}px` }}>
          <p style={counterStyle}>{index + 1} / {total}</p>
          <h1 style={h1Style}>{slide.headline}</h1>
          <p style={bodyStyle}>{slide.subtitle}</p>
        </div>
        <div style={{ height: 3, width: '33%', marginLeft: padding, marginBottom: padding, borderRadius: 99, background: ci.primaryColor, flexShrink: 0 }} />
        {ci.handle && (
          <p style={{ position: 'absolute', bottom: 16, right: 24, fontSize: 11, fontFamily: ci.bodyFont, opacity: 0.35, color: ci.textColor }}>
            @{ci.handle}
          </p>
        )}
      </div>
    )
  }

  if (slide.type === 'content') {
    return (
      <div style={{ ...slideStyle, background: ci.bgColor }} data-slide>
        <div style={{ height: 5, width: '100%', background: ci.primaryColor, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${padding}px` }}>
          <p style={counterStyle}>{index + 1} / {total}</p>
          <h2 style={h2Style}>{slide.headline}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: ci.spacious ? 14 : 10 }}>
            {slide.bullets.map((b, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ marginTop: 6, width: 7, height: 7, borderRadius: '50%', background: ci.primaryColor, flexShrink: 0, display: 'block' }} />
                <span style={{ ...bodyStyle, opacity: 0.85 }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        {ci.handle && (
          <p style={{ position: 'absolute', bottom: 16, right: 24, fontSize: 11, fontFamily: ci.bodyFont, opacity: 0.3, color: ci.textColor }}>
            @{ci.handle}
          </p>
        )}
      </div>
    )
  }

  // CTA
  return (
    <div style={{ ...slideStyle, background: ci.accentColor }} data-slide>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: `${padding}px` }}>
        <p style={counterStyle}>{index + 1} / {total}</p>
        <h2 style={{ ...h2Style, fontSize: '1.9rem', color: ci.bgColor }}>{slide.headline}</h2>
        <div style={{
          padding: '10px 28px', borderRadius: 99, background: ci.bgColor,
          fontFamily: ci.bodyFont, fontWeight: '600', fontSize: '0.9rem',
          color: ci.accentColor, marginTop: 8,
        }}>
          {slide.cta}
        </div>
        {ci.handle && (
          <p style={{ marginTop: 28, fontSize: 13, fontFamily: ci.bodyFont, fontWeight: '600', opacity: 0.65, color: ci.bgColor }}>
            @{ci.handle}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── CI Section ───────────────────────────────────────────────────────────────

function CISection({ ci, setCi, onFontsQuery }: {
  ci: CISettings
  setCi: React.Dispatch<React.SetStateAction<CISettings>>
  onFontsQuery: (q: string) => void
}) {
  const [mode, setMode] = useState<CIMode>('manual')
  const [ciText, setCiText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [extracted, setExtracted] = useState<Record<string, string> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(async (file: File) => {
    setExtracting(true)
    setImagePreview(URL.createObjectURL(file))
    try {
      const colors = await extractColorsFromImage(file)
      setCi(p => ({ ...p, primaryColor: colors.primary, bgColor: colors.bg, textColor: colors.text, accentColor: colors.primary }))
    } finally {
      setExtracting(false)
    }
  }, [setCi])

  const applyAiCI = useCallback(async () => {
    if (!ciText.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/carousel/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: ciText }),
      })
      const data = await res.json()
      setExtracted(data)
      setCi(p => ({
        ...p,
        primaryColor: data.primaryColor ?? p.primaryColor,
        bgColor: data.bgColor ?? p.bgColor,
        textColor: data.textColor ?? p.textColor,
        accentColor: data.accentColor ?? p.accentColor,
        headlineFont: data.headlineFont ?? p.headlineFont,
        bodyFont: data.bodyFont ?? p.bodyFont,
        headlineFontWeight: data.headlineFontWeight ?? p.headlineFontWeight,
        bodyFontWeight: data.bodyFontWeight ?? p.bodyFontWeight,
        lineHeight: data.lineHeight ?? p.lineHeight,
        letterSpacing: data.letterSpacing ?? p.letterSpacing,
        spacious: data.spacious ?? p.spacious,
      }))
      if (data.googleFontsQuery) onFontsQuery(data.googleFontsQuery)
    } finally {
      setAiLoading(false)
    }
  }, [ciText, setCi, onFontsQuery])

  const tabs: { id: CIMode; label: string; icon: string }[] = [
    { id: 'manual', label: 'Manuell', icon: '🎨' },
    { id: 'text', label: 'CI beschreiben', icon: '✍️' },
    { id: 'image', label: 'Logo / Bild', icon: '🖼️' },
  ]

  return (
    <div className="mb-6 border border-border rounded-xl overflow-hidden bg-surface-secondary">
      <div className="p-5 pb-0">
        <h3 className="text-sm font-semibold text-foreground mb-3">Corporate Identity</h3>
        <div className="flex gap-1 mb-4 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setMode(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                mode === t.id ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-foreground'
              }`}
            >{t.icon} {t.label}</button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Manual */}
        {mode === 'manual' && (
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: 'primaryColor', label: 'Primärfarbe' },
              { key: 'bgColor', label: 'Hintergrund' },
              { key: 'textColor', label: 'Textfarbe' },
              { key: 'accentColor', label: 'Akzentfarbe (CTA)' },
            ] as { key: keyof CISettings; label: string }[]).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-muted mb-1.5">{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={ci[key] as string}
                    onChange={(e) => setCi(p => ({ ...p, [key]: e.target.value }))}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer" />
                  <span className="text-xs text-muted font-mono">{ci[key] as string}</span>
                </div>
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1.5">Headline Font</label>
              <input type="text" value={ci.headlineFont}
                onChange={(e) => setCi(p => ({ ...p, headlineFont: e.target.value }))}
                placeholder="z.B. Playfair Display"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1.5">Body Font</label>
              <input type="text" value={ci.bodyFont}
                onChange={(e) => setCi(p => ({ ...p, bodyFont: e.target.value }))}
                placeholder="z.B. Raleway"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        )}

        {/* Text / CI beschreiben */}
        {mode === 'text' && (
          <div className="space-y-3">
            <textarea value={ciText} onChange={(e) => setCiText(e.target.value)}
              placeholder={'Farben:\nPrimär: #c991d8 (Flieder), #bae1d4 (Soft Mint)\nAkzent: #7d4431 (Tiefbraun)\n\nFonts:\nHeadlines: Black Mango\nFließtext: Raleway\n\nStil: Viel Whitespace, hoher Zeilenabstand, ruhige Komposition'}
              rows={8}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
            />
            <button onClick={applyAiCI} disabled={aiLoading || !ciText.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg> CI wird analysiert...</>
              ) : '✨ CI automatisch anwenden'}
            </button>

            {/* Extracted summary */}
            {extracted && !aiLoading && (
              <div className="bg-surface border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Erkannte CI-Werte:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded" style={{ background: extracted.primaryColor }} />
                    <span>Primär: <span className="font-mono">{extracted.primaryColor}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border border-black/10" style={{ background: extracted.bgColor }} />
                    <span>BG: <span className="font-mono">{extracted.bgColor}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded" style={{ background: extracted.textColor }} />
                    <span>Text: <span className="font-mono">{extracted.textColor}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded" style={{ background: extracted.accentColor }} />
                    <span>Akzent: <span className="font-mono">{extracted.accentColor}</span></span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border">
                    <span className="font-medium text-foreground">Headline:</span> {extracted.headlineFont} {extracted.headlineFontWeight}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-foreground">Body:</span> {extracted.bodyFont} {extracted.bodyFontWeight}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-foreground">Zeilenabstand:</span> {extracted.lineHeight} · Spacious: {extracted.spacious ? 'ja' : 'nein'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image */}
        {mode === 'image' && (
          <div className="space-y-3">
            <input type="file" ref={fileRef} accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
            <button onClick={() => fileRef.current?.click()}
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
            {extracting && <p className="text-xs text-center text-muted animate-pulse">Farben werden extrahiert...</p>}
            {!extracting && imagePreview && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Erkannt:</span>
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CarouselWorkflow() {
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [blogPost, setBlogPost] = useState('')
  const [ci, setCi] = useState<CISettings>(DEFAULT_CI)
  const [fontsQuery, setFontsQuery] = useState('')
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const slidesContainerRef = useRef<HTMLDivElement>(null)

  useGoogleFont(fontsQuery)

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
      alert('Fehler beim Generieren.')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [blogPost, ci.slideCount, ci.handle])

  const exportSlides = useCallback(async () => {
    if (!slides.length) return
    setExporting(true)
    setProgress('Slides werden gerendert...')
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
          scale: 2, useCORS: true, backgroundColor: null, logging: false,
        })
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png', 1.0))
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, blob)
      }
      setProgress('ZIP erstellen...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url; a.download = 'karussell.zip'; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Export fehlgeschlagen.')
    } finally {
      setExporting(false)
      setProgress('')
    }
  }, [slides])

  // ── Input ───────────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className="max-w-2xl mx-auto px-8 pt-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">🎠 Karussell-Generator</h1>
          <p className="text-muted text-sm">Blogpost oder Text rein — fertige Instagram-Slides raus</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Dein Text / Blogpost</label>
          <textarea value={blogPost} onChange={(e) => setBlogPost(e.target.value)}
            placeholder="Füge hier deinen Blogpost, LinkedIn-Artikel oder Text ein..."
            rows={10}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <CISection ci={ci} setCi={setCi} onFontsQuery={setFontsQuery} />

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs text-muted mb-1.5">Instagram Handle</label>
            <input type="text" value={ci.handle}
              onChange={(e) => setCi(p => ({ ...p, handle: e.target.value.replace('@', '') }))}
              placeholder="deinname"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Anzahl Slides: {ci.slideCount}</label>
            <input type="range" min={4} max={10} value={ci.slideCount}
              onChange={(e) => setCi(p => ({ ...p, slideCount: Number(e.target.value) }))}
              className="w-full mt-2 accent-primary" />
            <div className="flex justify-between text-xs text-muted mt-0.5"><span>4</span><span>10</span></div>
          </div>
        </div>

        <button onClick={generate} disabled={loading || !blogPost.trim()}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>{progress}</>) : '🎠 Karussell generieren'}
        </button>
      </div>
    )
  }

  // ── Preview ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-8 pt-8 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vorschau</h1>
          <p className="text-sm text-muted">{slides.length} Slides · 1080×1080px</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep('input')}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-secondary transition">
            ← Zurück
          </button>
          <button onClick={exportSlides} disabled={exporting}
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
        <div className="rounded-2xl overflow-hidden shadow-xl border border-border" style={{ width: 540, height: 540 }}>
          <SlideView slide={slides[activeSlide]} ci={ci} index={activeSlide} total={slides.length} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setActiveSlide(i)}
            className={`shrink-0 w-12 h-12 rounded-lg border-2 text-xs font-semibold transition ${
              i === activeSlide ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted hover:border-primary/40'
            }`}>{i + 1}</button>
        ))}
      </div>

      {/* Off-screen render container */}
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
