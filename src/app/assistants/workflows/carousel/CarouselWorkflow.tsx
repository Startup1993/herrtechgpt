'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TitleSlide { type: 'title'; headline: string; subtitle: string }
interface ContentSlide { type: 'content'; headline: string; bullets: string[] }
interface CtaSlide { type: 'cta'; headline: string; cta: string; handle: string }
type Slide = TitleSlide | ContentSlide | CtaSlide

interface CISettings {
  primaryColor: string; bgColor: string; textColor: string; accentColor: string
  handle: string; slideCount: number
  headlineFont: string; bodyFont: string
  headlineFontWeight: string; bodyFontWeight: string
  lineHeight: string; letterSpacing: string; spacious: boolean
}

type CIMode = 'preset' | 'url' | 'manual' | 'text'

// ─── Style presets ────────────────────────────────────────────────────────────

interface Preset extends Omit<CISettings, 'handle' | 'slideCount'> {
  id: string; name: string; emoji: string; googleFontsQuery: string
}

const PRESETS: Preset[] = [
  {
    id: 'soft', name: 'Soft & Clean', emoji: '☁️',
    primaryColor: '#9b7fd4', bgColor: '#fafafa', textColor: '#1a1a2e', accentColor: '#7c5cbf',
    headlineFont: 'Raleway', bodyFont: 'Raleway', headlineFontWeight: '700', bodyFontWeight: '400',
    lineHeight: '1.75', letterSpacing: '0.01em', spacious: true,
    googleFontsQuery: 'family=Raleway:wght@300;400;700;900',
  },
  {
    id: 'bold', name: 'Bold & Dark', emoji: '🖤',
    primaryColor: '#f59e0b', bgColor: '#111111', textColor: '#ffffff', accentColor: '#d97706',
    headlineFont: 'Bebas Neue', bodyFont: 'Inter', headlineFontWeight: '400', bodyFontWeight: '400',
    lineHeight: '1.3', letterSpacing: '0.04em', spacious: false,
    googleFontsQuery: 'family=Bebas+Neue&family=Inter:wght@400;600',
  },
  {
    id: 'pastel', name: 'Pastel', emoji: '🌸',
    primaryColor: '#d4829a', bgColor: '#fff5f7', textColor: '#3d1a24', accentColor: '#c4687e',
    headlineFont: 'Playfair Display', bodyFont: 'Lato', headlineFontWeight: '700', bodyFontWeight: '300',
    lineHeight: '1.8', letterSpacing: '0em', spacious: true,
    googleFontsQuery: 'family=Playfair+Display:wght@700;900&family=Lato:wght@300;400',
  },
  {
    id: 'vibrant', name: 'Vibrant', emoji: '⚡',
    primaryColor: '#7c3aed', bgColor: '#ffffff', textColor: '#1e1b4b', accentColor: '#6d28d9',
    headlineFont: 'Montserrat', bodyFont: 'Montserrat', headlineFontWeight: '800', bodyFontWeight: '400',
    lineHeight: '1.45', letterSpacing: '-0.01em', spacious: false,
    googleFontsQuery: 'family=Montserrat:wght@400;600;800',
  },
  {
    id: 'nature', name: 'Nature', emoji: '🌿',
    primaryColor: '#2d7d4f', bgColor: '#f0fdf4', textColor: '#14402a', accentColor: '#166534',
    headlineFont: 'Merriweather', bodyFont: 'Source Sans 3', headlineFontWeight: '700', bodyFontWeight: '400',
    lineHeight: '1.7', letterSpacing: '0em', spacious: true,
    googleFontsQuery: 'family=Merriweather:wght@700;900&family=Source+Sans+3:wght@300;400;600',
  },
  {
    id: 'elegant', name: 'Elegant', emoji: '🤍',
    primaryColor: '#a0785a', bgColor: '#fdf8f3', textColor: '#1c1410', accentColor: '#8b6347',
    headlineFont: 'Cormorant Garamond', bodyFont: 'Raleway', headlineFontWeight: '700', bodyFontWeight: '300',
    lineHeight: '1.85', letterSpacing: '0.02em', spacious: true,
    googleFontsQuery: 'family=Cormorant+Garamond:wght@600;700&family=Raleway:wght@300;400;600',
  },
]

const DEFAULT_CI: CISettings = {
  ...PRESETS[0],
  handle: '', slideCount: 7,
}

// ─── Google Fonts ─────────────────────────────────────────────────────────────

function useGoogleFont(query: string) {
  useEffect(() => {
    if (!query) return
    const id = 'carousel-gfont'
    document.getElementById(id)?.remove()
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`
    document.head.appendChild(link)
  }, [query])
}

// ─── Color extraction from image file ────────────────────────────────────────

async function extractColorsFromImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 80; canvas.height = 80
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, 80, 80)
      const data = ctx.getImageData(0, 0, 80, 80).data
      const freq: Record<string, number> = {}
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue
        const r = Math.round(data[i] / 24) * 24
        const g = Math.round(data[i + 1] / 24) * 24
        const b = Math.round(data[i + 2] / 24) * 24
        if (r > 235 && g > 235 && b > 235) continue
        if (r < 20 && g < 20 && b < 20) continue
        const key = `${r},${g},${b}`
        freq[key] = (freq[key] || 0) + 1
      }
      const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]
      URL.revokeObjectURL(url)
      if (!top) { resolve('#7c3aed'); return }
      const [r, g, b] = top[0].split(',').map(Number)
      resolve(`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`)
    }
    img.src = url
  })
}

// ─── Slide component ──────────────────────────────────────────────────────────

function SlideView({ slide, ci, index, total }: { slide: Slide; ci: CISettings; index: number; total: number }) {
  const pad = ci.spacious ? 56 : 44
  const base: React.CSSProperties = { width: 540, height: 540, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', flexShrink: 0 }
  const counter: React.CSSProperties = { fontSize: 11, fontFamily: ci.bodyFont, fontWeight: ci.bodyFontWeight, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.4, marginBottom: ci.spacious ? 22 : 14 }
  const h1: React.CSSProperties = { fontFamily: ci.headlineFont, fontWeight: ci.headlineFontWeight, lineHeight: ci.lineHeight, letterSpacing: ci.letterSpacing, fontSize: '2.15rem', color: ci.textColor, marginBottom: ci.spacious ? 18 : 10, wordBreak: 'break-word' }
  const h2: React.CSSProperties = { fontFamily: ci.headlineFont, fontWeight: ci.headlineFontWeight, lineHeight: ci.lineHeight, letterSpacing: ci.letterSpacing, fontSize: '1.5rem', color: ci.textColor, marginBottom: ci.spacious ? 22 : 14, wordBreak: 'break-word' }
  const body: React.CSSProperties = { fontFamily: ci.bodyFont, fontWeight: ci.bodyFontWeight, lineHeight: ci.lineHeight, letterSpacing: ci.letterSpacing, fontSize: '0.9rem', color: ci.textColor, opacity: 0.75, wordBreak: 'break-word' }

  if (slide.type === 'title') return (
    <div style={{ ...base, background: ci.bgColor }} data-slide>
      <div style={{ height: 7, width: '100%', background: ci.primaryColor, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: pad }}>
        <p style={{ ...counter, color: ci.primaryColor }}>{index + 1} / {total}</p>
        <h1 style={h1}>{slide.headline}</h1>
        <p style={body}>{slide.subtitle}</p>
      </div>
      <div style={{ height: 3, width: '30%', marginLeft: pad, marginBottom: pad, borderRadius: 99, background: ci.primaryColor, flexShrink: 0 }} />
      {ci.handle && <p style={{ position: 'absolute', bottom: 14, right: 20, fontSize: 10, fontFamily: ci.bodyFont, opacity: 0.3, color: ci.textColor }}>@{ci.handle}</p>}
    </div>
  )

  if (slide.type === 'content') return (
    <div style={{ ...base, background: ci.bgColor }} data-slide>
      <div style={{ height: 5, width: '100%', background: ci.primaryColor, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: pad }}>
        <p style={{ ...counter, color: ci.primaryColor }}>{index + 1} / {total}</p>
        <h2 style={h2}>{slide.headline}</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: ci.spacious ? 13 : 9 }}>
          {slide.bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <span style={{ marginTop: 5, width: 6, height: 6, borderRadius: '50%', background: ci.primaryColor, flexShrink: 0, display: 'block' }} />
              <span style={{ ...body, opacity: 0.85 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      {ci.handle && <p style={{ position: 'absolute', bottom: 14, right: 20, fontSize: 10, fontFamily: ci.bodyFont, opacity: 0.28, color: ci.textColor }}>@{ci.handle}</p>}
    </div>
  )

  return (
    <div style={{ ...base, background: ci.accentColor }} data-slide>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: pad }}>
        <p style={{ ...counter, color: ci.bgColor }}>{index + 1} / {total}</p>
        <h2 style={{ ...h2, fontSize: '1.85rem', color: ci.bgColor }}>{slide.headline}</h2>
        <div style={{ padding: '10px 26px', borderRadius: 99, background: ci.bgColor, fontFamily: ci.bodyFont, fontWeight: '600', fontSize: '0.88rem', color: ci.accentColor, marginTop: 6 }}>
          {slide.cta}
        </div>
        {ci.handle && <p style={{ marginTop: 26, fontSize: 12, fontFamily: ci.bodyFont, fontWeight: '600', opacity: 0.6, color: ci.bgColor }}>@{ci.handle}</p>}
      </div>
    </div>
  )
}

// ─── Preset tile ──────────────────────────────────────────────────────────────

function PresetTile({ preset, selected, onClick }: { preset: Preset; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'}`}
      style={{ background: preset.bgColor }}
    >
      {/* Mini slide preview */}
      <div style={{ height: 6, background: preset.primaryColor, width: '100%' }} />
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ height: 8, width: '60%', background: preset.primaryColor, borderRadius: 3, marginBottom: 6, opacity: 0.9 }} />
        <div style={{ height: 5, width: '85%', background: preset.textColor, borderRadius: 2, marginBottom: 4, opacity: 0.2 }} />
        <div style={{ height: 5, width: '70%', background: preset.textColor, borderRadius: 2, opacity: 0.15 }} />
        <div style={{ marginTop: 10, display: 'flex', gap: 3 }}>
          {[preset.primaryColor, preset.accentColor, preset.textColor].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
          ))}
        </div>
      </div>
      <div className="px-3 pb-2.5">
        <p className="text-xs font-semibold" style={{ color: preset.textColor, opacity: 0.8 }}>{preset.emoji} {preset.name}</p>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
    </button>
  )
}

// ─── CI Section ───────────────────────────────────────────────────────────────

function CISection({ ci, setCi, onFontsQuery }: {
  ci: CISettings
  setCi: React.Dispatch<React.SetStateAction<CISettings>>
  onFontsQuery: (q: string) => void
}) {
  const [mode, setMode] = useState<CIMode>('preset')
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESETS[0].id)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [ciText, setCiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const applyPreset = useCallback((preset: Preset) => {
    setSelectedPreset(preset.id)
    setCi(p => ({ ...p, ...preset }))
    onFontsQuery(preset.googleFontsQuery)
  }, [setCi, onFontsQuery])

  const extractFromUrl = useCallback(async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setUrlError('')
    try {
      let url = urlInput.trim()
      if (!url.startsWith('http')) url = 'https://' + url
      const res = await fetch('/api/carousel/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.error) { setUrlError(data.error); return }
      setCi(p => ({ ...p, ...data }))
      if (data.googleFontsQuery) onFontsQuery(data.googleFontsQuery)
    } catch {
      setUrlError('URL konnte nicht geladen werden.')
    } finally {
      setUrlLoading(false)
    }
  }, [urlInput, setCi, onFontsQuery])

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
      setCi(p => ({ ...p, ...data }))
      if (data.googleFontsQuery) onFontsQuery(data.googleFontsQuery)
    } finally {
      setAiLoading(false)
    }
  }, [ciText, setCi, onFontsQuery])

  const tabs = [
    { id: 'preset' as CIMode, label: 'Stil wählen', icon: '✨' },
    { id: 'url' as CIMode, label: 'Website / Dokument', icon: '🔗' },
    { id: 'manual' as CIMode, label: 'Manuell', icon: '🎨' },
    { id: 'text' as CIMode, label: 'CI-Text', icon: '✍️' },
  ]

  return (
    <div className="mb-6 border border-border rounded-xl overflow-hidden bg-surface-secondary">
      <div className="p-5 pb-0">
        <h3 className="text-sm font-semibold text-foreground mb-3">Design & Corporate Identity</h3>
        <div className="flex gap-1 mb-4 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setMode(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === t.id ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-foreground'}`}
            >{t.icon} {t.label}</button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5">

        {/* ── Presets ── */}
        {mode === 'preset' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {PRESETS.map(p => (
                <PresetTile key={p.id} preset={p} selected={selectedPreset === p.id} onClick={() => applyPreset(p)} />
              ))}
            </div>
            {/* Single color override */}
            <div className="flex items-center gap-3 pt-1 border-t border-border">
              <span className="text-xs text-muted shrink-0">Deine Markenfarbe:</span>
              <input type="color" value={ci.primaryColor}
                onChange={(e) => setCi(p => ({ ...p, primaryColor: e.target.value, accentColor: e.target.value }))}
                className="w-8 h-8 rounded-lg border border-border cursor-pointer shrink-0" />
              <span className="text-xs text-muted font-mono">{ci.primaryColor}</span>
              <span className="text-xs text-muted opacity-50">— überschreibt die Preset-Farbe</span>
            </div>
          </div>
        )}

        {/* ── URL ── */}
        {mode === 'url' && (
          <div className="space-y-3">
            <p className="text-xs text-muted">Website-URL eingeben — Farben werden automatisch extrahiert. Alternativ kannst du eine Bild-Datei (Logo, CI-Dokument) hochladen.</p>
            <div className="flex gap-2">
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && extractFromUrl()}
                placeholder="https://deine-website.de"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={extractFromUrl} disabled={urlLoading || !urlInput.trim()}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                {urlLoading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : '→'} Extrahieren
              </button>
            </div>
            {urlError && <p className="text-xs text-red-500">{urlError}</p>}

            {/* Image upload as alternative */}
            <div className="border-t border-border pt-3">
              <input type="file" ref={fileRef} accept="image/*,.pdf" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setImagePreview(URL.createObjectURL(f))
                  const color = await extractColorsFromImage(f)
                  setCi(p => ({ ...p, primaryColor: color, accentColor: color }))
                }} />
              <button onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-border rounded-lg py-3 text-xs text-muted hover:border-primary/40 hover:bg-surface transition flex items-center justify-center gap-2"
              >
                {imagePreview
                  ? <><img src={imagePreview} className="h-6 object-contain rounded" alt="" /> Anderes Bild wählen</>
                  : <><span>🖼️</span> Logo oder CI-Bild hochladen</>
                }
              </button>
            </div>

            {/* Preview of extracted colors */}
            {!urlLoading && (
              <div className="flex items-center gap-2 text-xs text-muted pt-1">
                <span>Aktuell:</span>
                {[ci.primaryColor, ci.bgColor, ci.textColor, ci.accentColor].map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded border border-black/10" style={{ background: c }} title={c} />
                ))}
                <span className="font-mono">{ci.primaryColor}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Manual ── */}
        {mode === 'manual' && (
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: 'primaryColor', label: 'Primärfarbe' },
              { key: 'bgColor', label: 'Hintergrund' },
              { key: 'textColor', label: 'Textfarbe' },
              { key: 'accentColor', label: 'Akzent / CTA' },
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
              <label className="block text-xs text-muted mb-1.5">Headline Font (Google Fonts Name)</label>
              <input type="text" value={ci.headlineFont} onChange={(e) => setCi(p => ({ ...p, headlineFont: e.target.value }))}
                placeholder="z.B. Playfair Display"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1.5">Body Font (Google Fonts Name)</label>
              <input type="text" value={ci.bodyFont} onChange={(e) => setCi(p => ({ ...p, bodyFont: e.target.value }))}
                placeholder="z.B. Raleway"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="text-xs text-muted">Viel Whitespace</label>
              <button onClick={() => setCi(p => ({ ...p, spacious: !p.spacious }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${ci.spacious ? 'bg-primary' : 'bg-border'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${ci.spacious ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* ── CI Text ── */}
        {mode === 'text' && (
          <div className="space-y-3">
            <textarea value={ciText} onChange={(e) => setCiText(e.target.value)}
              placeholder={'Farben:\nPrimär: #c991d8 (Flieder), #bae1d4 (Soft Mint)\nAkzent: #7d4431 (Tiefbraun)\n\nFonts:\nHeadlines: Black Mango\nFließtext: Raleway\n\nStil: Viel Whitespace, hoher Zeilenabstand, ruhige Komposition'}
              rows={7}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
            />
            <button onClick={applyAiCI} disabled={aiLoading || !ciText.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading
                ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> CI wird analysiert...</>
                : '✨ CI automatisch anwenden'}
            </button>
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
  const [fontsQuery, setFontsQuery] = useState(PRESETS[0].googleFontsQuery)
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
    } catch { alert('Fehler beim Generieren.') }
    finally { setLoading(false); setProgress('') }
  }, [blogPost, ci.slideCount, ci.handle])

  const exportSlides = useCallback(async () => {
    if (!slides.length) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const JSZip = (await import('jszip')).default
      const container = slidesContainerRef.current
      if (!container) return
      const slideEls = container.querySelectorAll('[data-slide]')
      const zip = new JSZip()
      for (let i = 0; i < slideEls.length; i++) {
        setProgress(`Slide ${i + 1} von ${slideEls.length}...`)
        const canvas = await html2canvas(slideEls[i] as HTMLElement, { scale: 2, useCORS: true, backgroundColor: null, logging: false })
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png', 1.0))
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, blob)
      }
      setProgress('ZIP erstellen...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a'); a.href = url; a.download = 'karussell.zip'; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error(err); alert('Export fehlgeschlagen.') }
    finally { setExporting(false); setProgress('') }
  }, [slides])

  if (step === 'input') return (
    <div className="max-w-2xl mx-auto px-8 pt-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">🎠 Karussell-Generator</h1>
        <p className="text-muted text-sm">Text rein — fertige Instagram-Slides raus</p>
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
          <label className="block text-xs text-muted mb-1.5">Instagram Handle (optional)</label>
          <input type="text" value={ci.handle} onChange={(e) => setCi(p => ({ ...p, handle: e.target.value.replace('@', '') }))}
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
        {loading
          ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{progress}</>
          : '🎠 Karussell generieren'}
      </button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-8 pt-8 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vorschau</h1>
          <p className="text-sm text-muted">{slides.length} Slides · 1080×1080px</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep('input')} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-secondary transition">← Zurück</button>
          <button onClick={exportSlides} disabled={exporting}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
          >
            {exporting
              ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{progress}</>
              : '⬇ ZIP downloaden'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-center">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-border" style={{ width: 540, height: 540 }}>
          <SlideView slide={slides[activeSlide]} ci={ci} index={activeSlide} total={slides.length} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setActiveSlide(i)}
            className={`shrink-0 w-12 h-12 rounded-lg border-2 text-xs font-semibold transition ${i === activeSlide ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted hover:border-primary/40'}`}
          >{i + 1}</button>
        ))}
      </div>

      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
        <div ref={slidesContainerRef} style={{ display: 'flex', flexDirection: 'column' }}>
          {slides.map((slide, i) => <SlideView key={i} slide={slide} ci={ci} index={i} total={slides.length} />)}
        </div>
      </div>
    </div>
  )
}
