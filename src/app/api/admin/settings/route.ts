/**
 * /api/admin/settings — Globale Plattform-Settings (Admin-only).
 *
 * GET  → liefert alle Settings (mit Defaults gemerged)
 * PUT  → speichert ein einzelnes Setting (Body: { key, value })
 *
 * Wir validieren server-seitig, dass der Key bekannt ist und der Typ stimmt.
 * RLS schützt zusätzlich (admin-only write), aber Validierung verhindert
 * Mist auch beim service_role-Client.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getAppSettings,
  setAppSetting,
  SETTING_KEYS,
  type AppSettings,
} from '@/lib/app-settings'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const settings = await getAppSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let body: { key?: string; value?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { key, value } = body

  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Feld "key" fehlt' }, { status: 400 })
  }

  // Validate key
  const validKeys = Object.keys(SETTING_KEYS) as Array<keyof AppSettings>
  if (!validKeys.includes(key as keyof AppSettings)) {
    return NextResponse.json(
      {
        error: `Unbekannter Setting-Key '${key}'. Erlaubt: ${validKeys.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const typedKey = key as keyof AppSettings

  // Type-Validierung pro Key
  if (typedKey === 'subscriptionsEnabled') {
    if (typeof value !== 'boolean') {
      return NextResponse.json(
        { error: `'${key}' muss ein Boolean sein` },
        { status: 400 }
      )
    }
  } else if (
    typedKey === 'communityMonthlyCredits' ||
    typedKey === 'starterTestCredits'
  ) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { error: `'${key}' muss eine nicht-negative Zahl sein` },
        { status: 400 }
      )
    }
  }

  try {
    await setAppSetting(typedKey, value as never, user.id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Return frische Settings für UI-Refresh
  const settings = await getAppSettings()
  return NextResponse.json(settings)
}
