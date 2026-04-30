import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { FEATURES, STATES, TIERS, type FeatureKey, type FeatureState } from '@/lib/permissions'
import { getAppSettings } from '@/lib/app-settings'
import type { AccessTier } from '@/lib/access'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

// PATCH: Matrix-Zelle aktualisieren
export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { type } = body

  const admin = createAdminClient()

  if (type === 'matrix') {
    const { tier, feature, state } = body as { tier?: string; feature?: string; state?: string }
    if (!TIERS.includes(tier as AccessTier)) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    if (!FEATURES.includes(feature as FeatureKey)) return NextResponse.json({ error: 'Invalid feature' }, { status: 400 })
    if (!STATES.includes(state as FeatureState)) return NextResponse.json({ error: 'Invalid state' }, { status: 400 })

    // In NoSubs-Welt: 'paid' ist kein erlaubter State (Abo-Konzept existiert
    // nicht). Wenn Subs aktiv sind ist 'paid' OK.
    const settings = await getAppSettings()
    if (!settings.subscriptionsEnabled && state === 'paid') {
      return NextResponse.json(
        {
          error:
            'Status "Abo-Zugriff" ist nicht verfügbar wenn das Abo-System deaktiviert ist. Wähle stattdessen "Community-only", "Freigeschaltet" oder "Coming Soon".',
        },
        { status: 400 }
      )
    }

    const { error } = await admin
      .from('feature_permissions')
      .upsert({ tier, feature, state, updated_at: new Date().toISOString() }, { onConflict: 'tier,feature' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Cache invalidieren — sonst sehen User in der Sidebar/Layout den
    // alten Status weiter (Layout wird nicht bei jedem Page-Load neu
    // gerendert in Next 16). Berechtigungsmatrix-Änderungen sollen
    // SOFORT durchschlagen.
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/admin/groups')

    return NextResponse.json({ success: true })
  }

  if (type === 'upsell') {
    const { tier, heading, intro, benefits, cta_label, cta_coming_soon, cta_url } = body as {
      tier?: string
      heading?: string
      intro?: string
      benefits?: string[]
      cta_label?: string
      cta_coming_soon?: boolean
      cta_url?: string | null
    }
    if (!TIERS.includes(tier as AccessTier)) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    if (typeof heading !== 'string' || typeof intro !== 'string') {
      return NextResponse.json({ error: 'heading/intro required' }, { status: 400 })
    }
    if (!Array.isArray(benefits) || !benefits.every((b) => typeof b === 'string')) {
      return NextResponse.json({ error: 'benefits must be string[]' }, { status: 400 })
    }

    const { error } = await admin
      .from('tier_upsell_copy')
      .upsert({
        tier,
        heading: heading.trim(),
        intro: intro.trim(),
        benefits: benefits.map((b) => b.trim()).filter(Boolean),
        cta_label: (cta_label ?? 'Jetzt beitreten').trim(),
        cta_coming_soon: cta_coming_soon ?? true,
        cta_url: cta_url?.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tier' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
