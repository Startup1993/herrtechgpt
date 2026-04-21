import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { description } = await req.json()
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages: [{
      role: 'user',
      content: `Du bist ein Branding-Experte. Analysiere diese CI-Beschreibung und extrahiere alle relevanten Design-Werte für Instagram-Karussell-Slides.

CI-Beschreibung:
"""
${description}
"""

Regeln:
- primaryColor: Hauptakzentfarbe (für Headlines, Bullet-Punkte, Akzentbalken). Wähle die auffälligste/markanteste Farbe.
- bgColor: Hintergrundfarbe der Slides (hell, ruhig — oft weiß oder sehr heller Ton aus der Palette)
- textColor: Haupttextfarbe (dunkel genug für gute Lesbarkeit auf bgColor)
- accentColor: Zweite Akzentfarbe für CTA-Slide-Hintergrund oder Highlights
- headlineFont: Exakter Font-Name für Headlines. Wenn der Font auf Google Fonts verfügbar ist, nimm ihn direkt. Wenn nicht (z.B. "Black Mango"), wähle den ähnlichsten Google Font (z.B. "Playfair Display" für elegante Display-Fonts, "Bebas Neue" für Bold-Sans-Fonts).
- bodyFont: Exakter Font-Name für Fließtext/Bullets. Wenn auf Google Fonts: direkt nutzen. Sonst ähnlichen nehmen.
- headlineFontWeight: CSS font-weight für Headlines (z.B. "900", "700", "800")
- bodyFontWeight: CSS font-weight für Body-Text (z.B. "300", "400", "600")
- lineHeight: CSS line-height Wert als String (z.B. "1.8" für viel Whitespace, "1.4" für kompakt)
- letterSpacing: CSS letter-spacing (z.B. "0.02em" für leicht gesperrt, "0em" für normal)
- spacious: true wenn der Stil viel Whitespace/Luft haben soll, false für kompakt
- googleFontsQuery: URL-Parameter für Google Fonts API (kombiniere beide Fonts). Beispiel: "family=Playfair+Display:wght@700;900&family=Raleway:wght@300;400;600"

Gib NUR valides JSON zurück, kein Text davor oder danach:
{
  "primaryColor": "#hex",
  "bgColor": "#hex",
  "textColor": "#hex",
  "accentColor": "#hex",
  "headlineFont": "Font Name",
  "bodyFont": "Font Name",
  "headlineFontWeight": "900",
  "bodyFontWeight": "400",
  "lineHeight": "1.7",
  "letterSpacing": "0em",
  "spacious": true,
  "googleFontsQuery": "family=..."
}`,
    }],
  })

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({
      primaryColor: '#7c3aed', bgColor: '#ffffff', textColor: '#111111', accentColor: '#7c3aed',
      headlineFont: 'Inter', bodyFont: 'Inter', headlineFontWeight: '700', bodyFontWeight: '400',
      lineHeight: '1.5', letterSpacing: '0em', spacious: false, googleFontsQuery: 'family=Inter:wght@400;700'
    })
  }
}
