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

const DEFAULT_CI: CISettings = { ...PRESETS[0], handle: '', slideCount: 7 }

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

// ─── Color extraction from image ──────────────────────────────────────────────

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
        freq[`${r},${g},${b}`] = (freq[`${r},${g},${b}`] || 0) + 1
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

// ─── Editable text ────────────────────────────────────────────────────────────

function EditableText({
  value, onChange, style, multiline = false, className = ''
}: {
  value: string; onChange: (v: string) => void
  style?: React.CSSProperties; multiline?: boolean; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  if (editing) {
    const sharedProps = {
      ref: ref as any,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
      onBlur: () => setEditing(false),
      onKeyDown: (e: React.KeyboardEvent) => { if (!multiline && e.key === 'Enter') setEditing(false) },
      style: { ...style, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', outline: 'none', borderRadius: 4, padding: '2px 4px', width: '100%', resize: 'none' as const, fontFamily: 'inherit' },
      className,
    }
    return multiline
      ? <textarea {...sharedProps} rows={Math.max(2, value.split('\n').length)} />
      : <input {...sharedProps} />
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Klicken zum Bearbeiten"
      style={{ ...style, cursor: 'text', display: 'block', borderRadius: 4, padding: '2px 4px', transition: 'background 0.15s' }}
      className={`hover:bg-black/5 hover:outline hover:outline-1 hover:outline-black/10 ${className}`}
    >{value}</span>
  )
}

// ─── Slide component ──────────────────────────────────────────────────────────

function SlideView({
  slide, ci, index, total, onEdit, isExport = false
}: {
  slide: Slide; ci: CISettings; index: number; total: number
  onEdit?: (updated: Slide) => void
  isExport?: boolean
}) {
  const pad = ci.spacious ? 56 : 44
  const base: React.CSSProperties = {
    width: 540, height: 540, overflow: 'hidden', position: 'relative',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  }
  const counter: React.CSSProperties = {
    fontSize: 11, fontFamily: ci.bodyFont, fontWeight: ci.bodyFontWeight,
    letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.4,
    marginBottom: ci.spacious ? 22 : 14,
  }
  const h1: React.CSSProperties = {
    fontFamily: ci.headlineFont, fontWeight: ci.headlineFontWeight,
    lineHeight: ci.lineHeight, letterSpacing: ci.letterSpacing,
    fontSize: '2.15rem', color: ci.textColor,
    marginBottom: ci.spacious ? 18 : 10, wordBreak: 'break-word',
  }
  const h2: React.CSSProperties = {
    fontFamily: ci.headlineFont, fontWeight: ci.headlineFontWeight,
    lineHeight: ci.lineHeight, letterSpacing: ci.letterSpacing,
    fontSize: '1.5rem', color: ci.textColor,
    marginBottom: ci.spacious ? 22 : 14, wordBreak: 'break-word',
  }
  const body: React.CSSProperties = {
    fontFamily: ci.bodyFont, fontWeight: ci.bodyFontWeight,
    lineHeight: ci.lineHeight, letterSpacing: ci.letterSpacing,
    fontSize: '0.9rem', color: ci.textColor, opacity: 0.75, wordBreak: 'break-word',
  }

  const edit = !isExport && !!onEdit

  if (slide.type === 'title') return (
    <div style={{ ...base, background: ci.bgColor }} data-slide>
      <div style={{ height: 7, width: '100%', background: ci.primaryColor, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: pad }}>
        <p style={{ ...counter, color: ci.primaryColor }}>{index + 1} / {total}</p>
        {edit
          ? <EditableText value={slide.headline} style={h1} multiline onChange={(v) => onEdit?.({ ...slide, headline: v })} />
          : <h1 style={h1}>{slide.headline}</h1>}
        {edit
          ? <EditableText value={slide.subtitle} style={body} multiline onChange={(v) => onEdit?.({ ...slide, subtitle: v })} />
          : <p style={body}>{slide.subtitle}</p>}
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
        {edit
          ? <EditableText value={slide.headline} style={h2} multiline onChange={(v) => onEdit?.({ ...slide, headline: v })} />
          : <h2 style={h2}>{slide.headline}</h2>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: ci.spacious ? 13 : 9 }}>
          {slide.bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <span style={{ marginTop: 5, width: 6, height: 6, borderRadius: '50%', background: ci.primaryColor, flexShrink: 0, display: 'block' }} />
              {edit
                ? <EditableText value={b} style={{ ...body, opacity: 0.85, flex: 1 }} multiline
                    onChange={(v) => {
                      const bullets = [...slide.bullets]
                      bullets[i] = v
                      onEdit?.({ ...slide, bullets })
                    }} />
                : <span style={{ ...body, opacity: 0.85 }}>{b}</span>}
            </li>
          ))}
        </ul>
      </div>
      {ci.handle && <p style={{ position: 'absolute', bottom: 14, right: 20, fontSize: 10, fontFamily: ci.bodyFont, opacity: 0.28, color: ci.textColor }}>@{ci.handle}</p>}
    </div>
  )

  // CTA
  return (
    <div style={{ ...base, background: ci.accentColor }} data-slide>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: pad }}>
        <p style={{ ...counter, color: ci.bgColor }}>{index + 1} / {total}</p>
        {edit
          ? <EditableText value={slide.headline} style={{ ...h2, fontSize: '1.85rem', color: ci.bgColor, textAlign: 'center' }} multiline onChange={(v) => onEdit?.({ ...slide, headline: v })} />
          : <h2 style={{ ...h2, fontSize: '1.85rem', color: ci.bgColor }}>{slide.headline}</h2>}
        <div style={{ padding: '10px 26px', borderRadius: 99, background: ci.bgColor, fontFamily: ci.bodyFont, fontWeight: '600', fontSize: '0.88rem', color: ci.accentColor, marginTop: 6 }}>
          {edit
            ? <EditableText value={slide.cta} style={{ color: ci.accentColor, fontFamily: ci.bodyFont, fontWeight: '600', fontSize: '0.88rem' }} onChange={(v) => onEdit?.({ ...slide, cta: v })} />
            : slide.cta}
        </div>
        {ci.handle && <p style={{ marginTop: 26, fontSize: 12, fontFamily: ci.bodyFont, fontWeight: '600', opacity: 0.6, color: ci.bgColor }}>@{ci.handle}</p>}
      </div>
    </div>
  )
}

// ─── PPTX export ─────────────────────────────────────────────────────────────

async function exportPptx(slides: Slide[], ci: CISettings) {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'SQUARE', width: 5, height: 5 })
  pptx.layout = 'SQUARE'

  const hex = (c: string) => c.replace('#', '')
  const W = 5; const H = 5
  const pad = ci.spacious ? 0.55 : 0.44

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const pSlide = pptx.addSlide()

    if (slide.type === 'title') {
      pSlide.background = { color: hex(ci.bgColor) }
      // Top bar
      pSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.07, fill: { color: hex(ci.primaryColor) } })
      // Counter
      pSlide.addText(`${i + 1} / ${slides.length}`, { x: pad, y: pad + 0.1, w: W - pad * 2, h: 0.2, fontSize: 8, color: hex(ci.primaryColor), charSpacing: 4 })
      // Headline
      pSlide.addText(slide.headline, { x: pad, y: pad + 0.4, w: W - pad * 2, h: 1.8, fontSize: 26, bold: true, color: hex(ci.textColor), fontFace: ci.headlineFont, lineSpacingMultiple: parseFloat(ci.lineHeight), wrap: true })
      // Subtitle
      pSlide.addText(slide.subtitle, { x: pad, y: H * 0.52, w: W - pad * 2, h: 0.8, fontSize: 11, color: hex(ci.textColor), fontFace: ci.bodyFont, transparency: 30, lineSpacingMultiple: parseFloat(ci.lineHeight), wrap: true })
      // Bottom bar
      pSlide.addShape(pptx.ShapeType.rect, { x: pad, y: H - pad - 0.03, w: 1.2, h: 0.03, fill: { color: hex(ci.primaryColor) } })
      // Handle
      if (ci.handle) pSlide.addText(`@${ci.handle}`, { x: W - 1.2, y: H - 0.25, w: 1.1, h: 0.2, fontSize: 7, color: hex(ci.textColor), transparency: 70, align: 'right' })

    } else if (slide.type === 'content') {
      pSlide.background = { color: hex(ci.bgColor) }
      pSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.05, fill: { color: hex(ci.primaryColor) } })
      pSlide.addText(`${i + 1} / ${slides.length}`, { x: pad, y: pad + 0.1, w: W - pad * 2, h: 0.2, fontSize: 8, color: hex(ci.primaryColor), charSpacing: 4 })
      pSlide.addText(slide.headline, { x: pad, y: pad + 0.4, w: W - pad * 2, h: 1.2, fontSize: 19, bold: true, color: hex(ci.textColor), fontFace: ci.headlineFont, lineSpacingMultiple: parseFloat(ci.lineHeight), wrap: true })
      const bulletY = ci.spacious ? H * 0.48 : H * 0.44
      const bulletGap = ci.spacious ? 0.35 : 0.28
      slide.bullets.forEach((b, bi) => {
        const y = bulletY + bi * bulletGap
        // Dot
        pSlide.addShape(pptx.ShapeType.ellipse, { x: pad, y: y + 0.07, w: 0.07, h: 0.07, fill: { color: hex(ci.primaryColor) } })
        pSlide.addText(b, { x: pad + 0.15, y, w: W - pad * 2 - 0.15, h: 0.28, fontSize: 10, color: hex(ci.textColor), fontFace: ci.bodyFont, transparency: 20, wrap: true, lineSpacingMultiple: parseFloat(ci.lineHeight) })
      })
      if (ci.handle) pSlide.addText(`@${ci.handle}`, { x: W - 1.2, y: H - 0.25, w: 1.1, h: 0.2, fontSize: 7, color: hex(ci.textColor), transparency: 70, align: 'right' })

    } else {
      pSlide.background = { color: hex(ci.accentColor) }
      pSlide.addText(`${i + 1} / ${slides.length}`, { x: pad, y: pad, w: W - pad * 2, h: 0.2, fontSize: 8, color: hex(ci.bgColor), charSpacing: 4, align: 'center', transparency: 60 })
      pSlide.addText(slide.headline, { x: pad, y: H * 0.3, w: W - pad * 2, h: 1.5, fontSize: 22, bold: true, color: hex(ci.bgColor), fontFace: ci.headlineFont, align: 'center', lineSpacingMultiple: parseFloat(ci.lineHeight), wrap: true })
      // CTA pill
      pSlide.addShape(pptx.ShapeType.roundRect, { x: W / 2 - 1.2, y: H * 0.62, w: 2.4, h: 0.36, fill: { color: hex(ci.bgColor) }, rectRadius: 0.1 })
      pSlide.addText(slide.cta, { x: W / 2 - 1.2, y: H * 0.62, w: 2.4, h: 0.36, fontSize: 10, bold: true, color: hex(ci.accentColor), fontFace: ci.bodyFont, align: 'center' })
      if (ci.handle) pSlide.addText(`@${ci.handle}`, { x: 0, y: H * 0.78, w: W, h: 0.2, fontSize: 11, bold: true, color: hex(ci.bgColor), fontFace: ci.bodyFont, transparency: 40, align: 'center' })
    }
  }

  await pptx.writeFile({ fileName: 'karussell.pptx' })
}

// ─── Preset tile ──────────────────────────────────────────────────────────────

function PresetTile({ preset, selected, onClick }: { preset: Preset; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'}`}
      style={{ background: preset.bgColor }}
    >
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
    setUrlLoading(true); setUrlError('')
    try {
      let url = urlInput.trim()
      if (!url.startsWith('http')) url = 'https://' + url
      const res = await fetch('/api/carousel/extract-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.error) { setUrlError(data.error); return }
      setCi(p => ({ ...p, ...data }))
      if (data.googleFontsQuery) onFontsQuery(data.googleFontsQuery)
    } catch { setUrlError('URL konnte nicht geladen werden.') }
    finally { setUrlLoading(false) }
  }, [urlInput, setCi, onFontsQuery])

  const applyAiCI = useCallback(async () => {
    if (!ciText.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/carousel/colors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: ciText }),
      })
      const data = await res.json()
      setCi(p => ({ ...p, ...data }))
      if (data.googleFontsQuery) onFontsQuery(data.googleFontsQuery)
    } finally { setAiLoading(false) }
  }, [ciText, setCi, onFontsQuery])

  const tabs = [
    { id: 'preset' as CIMode, label: 'Stil wählen', icon: '✨' },
    { id: 'url' as CIMode, label: 'Website / Logo', icon: '🔗' },
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
        {mode === 'preset' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {PRESETS.map(p => <PresetTile key={p.id} preset={p} selected={selectedPreset === p.id} onClick={() => applyPreset(p)} />)}
            </div>
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

        {mode === 'url' && (
          <div className="space-y-3">
            <p className="text-xs text-muted">Website-URL eingeben — Farben werden automatisch extrahiert. Oder Logo / CI-Bild hochladen.</p>
            <div className="flex gap-2">
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && extractFromUrl()}
                placeholder="https://deine-website.de"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={extractFromUrl} disabled={urlLoading || !urlInput.trim()}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >{urlLoading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : '→'} Extrahieren</button>
            </div>
            {urlError && <p className="text-xs text-red-500">{urlError}</p>}
            <div className="border-t border-border pt-3">
              <input type="file" ref={fileRef} accept="image/*" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return
                  setImagePreview(URL.createObjectURL(f))
                  const color = await extractColorsFromImage(f)
                  setCi(p => ({ ...p, primaryColor: color, accentColor: color }))
                }} />
              <button onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-border rounded-lg py-3 text-xs text-muted hover:border-primary/40 hover:bg-surface transition flex items-center justify-center gap-2"
              >
                {imagePreview
                  ? <><img src={imagePreview} className="h-6 object-contain rounded" alt="" /> Anderes Bild wählen</>
                  : <><span>🖼️</span> Logo oder CI-Bild hochladen</>}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted pt-1">
              <span>Aktuell:</span>
              {[ci.primaryColor, ci.bgColor, ci.textColor, ci.accentColor].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded border border-black/10" style={{ background: c }} title={c} />
              ))}
              <span className="font-mono">{ci.primaryColor}</span>
            </div>
          </div>
        )}

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
              <label className="block text-xs text-muted mb-1.5">Headline Font</label>
              <input type="text" value={ci.headlineFont} onChange={(e) => setCi(p => ({ ...p, headlineFont: e.target.value }))}
                placeholder="z.B. Playfair Display"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1.5">Body Font</label>
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

        {mode === 'text' && (
          <div className="space-y-3">
            <textarea value={ciText} onChange={(e) => setCiText(e.target.value)}
              placeholder={'Farben:\nPrimär: #c991d8 (Flieder), #bae1d4 (Soft Mint)\nAkzent: #7d4431 (Tiefbraun)\n\nFonts:\nHeadlines: Playfair Display\nFließtext: Raleway\n\nStil: Viel Whitespace, hoher Zeilenabstand, ruhige Komposition'}
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
  const [refining, setRefining] = useState(false)
  const [refineInput, setRefineInput] = useState('')
  const [refineHistory, setRefineHistory] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const slidesContainerRef = useRef<HTMLDivElement>(null)
  const refineInputRef = useRef<HTMLTextAreaElement>(null)

  useGoogleFont(fontsQuery)

  const generate = useCallback(async () => {
    if (!blogPost.trim()) return
    setLoading(true); setProgress('KI analysiert deinen Text...')
    try {
      const res = await fetch('/api/carousel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPost, slideCount: ci.slideCount, handle: ci.handle }),
      })
      const data = await res.json()
      setSlides(data.slides)
      setActiveSlide(0)
      setStep('preview')
    } catch { alert('Fehler beim Generieren.') }
    finally { setLoading(false); setProgress('') }
  }, [blogPost, ci.slideCount, ci.handle])

  const updateSlide = useCallback((i: number, updated: Slide) => {
    setSlides(s => s.map((sl, idx) => idx === i ? updated : sl))
  }, [])

  const refineSlides = useCallback(async () => {
    if (!refineInput.trim() || refining) return
    const prompt = refineInput.trim()
    setRefining(true)
    setRefineInput('')
    try {
      const res = await fetch('/api/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refinePrompt: prompt,
          currentSlides: slides,
          currentCI: {
            bgColor: ci.bgColor,
            primaryColor: ci.primaryColor,
            textColor: ci.textColor,
            accentColor: ci.accentColor,
          },
        }),
      })
      const data = await res.json()
      if (data.slides) setSlides(data.slides)
      if (data.ci) setCi(p => ({ ...p, ...data.ci }))
      setRefineHistory(h => [...h, prompt])
      setActiveSlide(0)
    } catch { alert('Fehler beim Überarbeiten.') }
    finally { setRefining(false) }
  }, [refineInput, slides, ci, refining])

  const exportPng = useCallback(async () => {
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
        const canvas = await html2canvas(slideEls[i] as HTMLElement, {
          scale: 2, useCORS: true, backgroundColor: null, logging: false,
        })
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

  const exportPptxFn = useCallback(async () => {
    if (!slides.length) return
    setExporting(true)
    try {
      setProgress('PowerPoint erstellen...')
      await exportPptx(slides, ci)
    } catch (err) { console.error(err); alert('Export fehlgeschlagen.') }
    finally { setExporting(false); setProgress('') }
  }, [slides, ci])

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
    <div className="px-6 pt-8 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vorschau & Bearbeitung</h1>
          <p className="text-sm text-muted">{slides.length} Slides · Text anklicken zum Bearbeiten</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStep('input')} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-secondary transition">← Zurück</button>
          <button onClick={exportPptxFn} disabled={exporting}
            className="px-4 py-2 border border-border bg-surface text-sm font-medium rounded-lg hover:bg-surface-secondary transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {exporting && progress.includes('Power')
              ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{progress}</>
              : '📊 Als .pptx'}
          </button>
          <button onClick={exportPng} disabled={exporting}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {exporting && !progress.includes('Power')
              ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{progress}</>
              : '⬇ PNG ZIP'}
          </button>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-6 items-start">

        {/* Left: Chat-style prompt panel */}
        <div className="w-72 shrink-0 flex flex-col border border-border rounded-xl bg-surface overflow-hidden" style={{ height: 600 }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <p className="text-xs font-semibold text-foreground">✏️ Slides anpassen</p>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {refineHistory.length === 0 ? (
              <div className="flex flex-col gap-1.5 mt-2">
                {['"Headlines kürzer machen"', '"Emojis hinzufügen"', '"Auf Englisch übersetzen"', '"CTA direkter machen"', '"Mehr Bullet Points"'].map((ex, i) => (
                  <button key={i} onClick={() => setRefineInput(ex.replace(/"/g, ''))}
                    className="text-left text-xs text-muted px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:text-foreground hover:bg-surface-secondary transition">
                    {ex}
                  </button>
                ))}
              </div>
            ) : (
              refineHistory.map((h, i) => (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-primary text-white text-xs leading-relaxed">
                    {h}
                  </div>
                </div>
              ))
            )}
            {refining && (
              <div className="flex items-center gap-2 text-xs text-muted px-1">
                <svg className="animate-spin w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Slides werden angepasst...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={refineInputRef}
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); refineSlides() } }}
                placeholder="Anpassung beschreiben..."
                rows={2}
                disabled={refining}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm text-foreground bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted disabled:opacity-50"
              />
              <button
                onClick={refineSlides}
                disabled={refining || !refineInput.trim()}
                className="shrink-0 w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Slide preview + navigation below */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border" style={{ width: 540, height: 540 }}>
            {slides[activeSlide] && (
              <SlideView
                slide={slides[activeSlide]}
                ci={ci}
                index={activeSlide}
                total={slides.length}
                onEdit={(updated) => updateSlide(activeSlide, updated)}
              />
            )}
          </div>
          {/* Slide navigation below preview */}
          <div className="flex gap-2 flex-wrap justify-center" style={{ width: 540 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)}
                className={`w-12 h-12 rounded-xl border-2 text-xs font-semibold transition ${i === activeSlide ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted hover:border-primary/40'}`}
              >{i + 1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden export container */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
        <div ref={slidesContainerRef} style={{ display: 'flex', flexDirection: 'column' }}>
          {slides.map((slide, i) => (
            <SlideView key={i} slide={slide} ci={ci} index={i} total={slides.length} isExport />
          ))}
        </div>
      </div>
    </div>
  )
}
