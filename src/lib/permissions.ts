import type { SupabaseClient } from '@supabase/supabase-js'
import type { AccessTier } from './access'
import { getAppSettings } from './app-settings'

export type FeatureKey = 'classroom' | 'chat' | 'toolbox'
export type FeatureState = 'open' | 'coming_soon' | 'community' | 'paid'

export const FEATURES: FeatureKey[] = ['classroom', 'chat', 'toolbox']
export const STATES: FeatureState[] = ['open', 'coming_soon', 'community', 'paid']
export const TIERS: AccessTier[] = ['basic', 'alumni', 'premium']

export const FEATURE_LABELS: Record<FeatureKey, { label: string; emoji: string }> = {
  classroom: { label: 'Classroom', emoji: '🎓' },
  chat:      { label: 'Herr Tech GPT', emoji: '🤖' },
  toolbox:   { label: 'KI Toolbox', emoji: '🔧' },
}

export const STATE_META: Record<FeatureState, { label: string; hint: string; badge: string }> = {
  open:        { label: 'Freigeschaltet',  hint: 'Voller Zugriff, keine Paywall',          badge: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  coming_soon: { label: 'Coming Soon',     hint: 'Sichtbar, noch nicht nutzbar',           badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  community:   { label: 'Community-only',  hint: 'Nur für KI Marketing Club Mitglieder',   badge: 'bg-primary/10 text-primary' },
  paid:        { label: 'Abo-Zugriff',     hint: 'Seite sichtbar, Aktionen brauchen Abo',  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
}

export const TIER_META: Record<AccessTier, { label: string; hint: string; dot: string }> = {
  basic:   { label: 'Basic (Free)',       hint: 'Neue User ohne Mitgliedschaft',  dot: 'bg-muted' },
  alumni:  { label: 'Alumni',             hint: 'Ehemalige Mitglieder',           dot: 'bg-amber-500' },
  premium: { label: 'Community (Premium)',hint: 'Aktive KI Marketing Club Mitglieder', dot: 'bg-green-500' },
}

export interface UpsellCopy {
  tier: AccessTier
  heading: string
  intro: string
  benefits: string[]
  cta_label: string
  cta_coming_soon: boolean
  cta_url: string | null
}

export type PermissionMatrix = Record<AccessTier, Record<FeatureKey, FeatureState>>

// ─── Defaults im Abo-Modell (Legacy / wenn subscriptions_enabled=true) ───
// - Classroom: Alumni lebenslang, Basic nur Community
// - Chat + Toolbox: 'paid' = Seite sichtbar, Aktionen brauchen Abo
//   Community-User haben Plan S gratis, müssen ihn aber aktivieren.
const DEFAULT_MATRIX_LEGACY: PermissionMatrix = {
  basic:   { classroom: 'community',   chat: 'paid', toolbox: 'paid' },
  alumni:  { classroom: 'open',        chat: 'paid', toolbox: 'paid' },
  premium: { classroom: 'open',        chat: 'paid', toolbox: 'paid' },
}

// ─── Defaults im Community-only Modell (subscriptions_enabled=false) ───
// Jacob: "credits zählen nur für die toolbox! herr tech gpt bekomme ich
// nur in der community".
//
// - Toolbox: 'community' für basic (= Self-Registrierte ohne Mitgliedschaft).
//   Sie müssen erst Community beitreten ODER (späteres Funnel-Paket) kaufen.
// - Toolbox: 'open' für alumni (haben mal bezahlt, dürfen mit Resten weiter
//   arbeiten + Credit-Packs nachkaufen) und premium (volle Mitgliedschaft).
// - Chat (Herr Tech GPT) + Classroom: 'community' für alle Nicht-Premium.
//   Alumni verlieren Classroom-Zugang (kein "lebenslang" mehr) — Jacob:
//   "wenn sie weg sind sind sie dann weg, können dann der community auch
//   beitreten um so zugriff auf alles zu bekommen"
//
// In NoSubs-Welt werden DB-Overrides aus feature_permissions zusätzlich
// angewendet — Admin kann via "Gruppen & Rechte" einzelne Felder anpassen
// (z.B. Toolbox auch für basic öffnen wenn ein Funnel-Paket lebt).
const DEFAULT_MATRIX_NOSUBS: PermissionMatrix = {
  basic:   { classroom: 'community',   chat: 'community', toolbox: 'community' },
  alumni:  { classroom: 'community',   chat: 'community', toolbox: 'open' },
  premium: { classroom: 'open',        chat: 'open',      toolbox: 'open' },
}

// Backwards-compat Alias (alter Name, falls woanders importiert).
const DEFAULT_MATRIX = DEFAULT_MATRIX_LEGACY

const DEFAULT_UPSELL: Record<AccessTier, UpsellCopy> = {
  basic: {
    tier: 'basic',
    heading: 'Alles freischalten — im KI Marketing Club',
    intro: 'Werde Teil der Community.',
    benefits: [],
    cta_label: 'Jetzt beitreten',
    cta_coming_soon: true,
    cta_url: 'https://www.skool.com/herr-tech',
  },
  alumni: {
    tier: 'alumni',
    heading: 'Komm zurück in den KI Marketing Club',
    intro: 'Reaktiviere deine Mitgliedschaft.',
    benefits: [],
    cta_label: 'Mitgliedschaft reaktivieren',
    cta_coming_soon: true,
    cta_url: 'https://www.skool.com/herr-tech',
  },
  premium: {
    tier: 'premium',
    heading: 'KI Marketing Club',
    intro: 'Du hast vollen Zugriff.',
    benefits: [],
    cta_label: 'Zur Community',
    cta_coming_soon: false,
    cta_url: 'https://www.skool.com/herr-tech',
  },
}

export async function getPermissionMatrix(supabase: SupabaseClient): Promise<PermissionMatrix> {
  // Defaults wählen je nach Modus, dann DB-Overrides aus feature_permissions
  // drauflegen. So kann Admin via "Gruppen & Rechte" einzelne Felder
  // anpassen — funktioniert in beiden Modi.
  const settings = await getAppSettings()
  const defaults = settings.subscriptionsEnabled
    ? DEFAULT_MATRIX_LEGACY
    : DEFAULT_MATRIX_NOSUBS

  const matrix: PermissionMatrix = JSON.parse(JSON.stringify(defaults))
  const { data } = await supabase.from('feature_permissions').select('tier, feature, state')
  for (const row of data ?? []) {
    const t = row.tier as AccessTier
    const f = row.feature as FeatureKey
    const s = row.state as FeatureState
    if (matrix[t] && FEATURES.includes(f)) matrix[t][f] = s
  }
  return matrix
}

export async function getFeatureState(
  supabase: SupabaseClient,
  tier: AccessTier,
  feature: FeatureKey,
): Promise<FeatureState> {
  const settings = await getAppSettings()
  const defaults = settings.subscriptionsEnabled
    ? DEFAULT_MATRIX_LEGACY
    : DEFAULT_MATRIX_NOSUBS

  const { data } = await supabase
    .from('feature_permissions')
    .select('state')
    .eq('tier', tier)
    .eq('feature', feature)
    .maybeSingle()
  return (data?.state as FeatureState) ?? defaults[tier][feature]
}

export async function getAllUpsellCopy(supabase: SupabaseClient): Promise<Record<AccessTier, UpsellCopy>> {
  const copies: Record<AccessTier, UpsellCopy> = JSON.parse(JSON.stringify(DEFAULT_UPSELL))
  const { data } = await supabase.from('tier_upsell_copy').select('*')
  for (const row of data ?? []) {
    const t = row.tier as AccessTier
    if (!copies[t]) continue
    copies[t] = {
      tier: t,
      heading: row.heading ?? copies[t].heading,
      intro: row.intro ?? copies[t].intro,
      benefits: Array.isArray(row.benefits) ? row.benefits : copies[t].benefits,
      cta_label: row.cta_label ?? copies[t].cta_label,
      cta_coming_soon: row.cta_coming_soon ?? copies[t].cta_coming_soon,
      cta_url: row.cta_url ?? copies[t].cta_url,
    }
  }
  return copies
}

export async function getUpsellCopy(supabase: SupabaseClient, tier: AccessTier): Promise<UpsellCopy> {
  const { data } = await supabase.from('tier_upsell_copy').select('*').eq('tier', tier).maybeSingle()
  if (!data) return DEFAULT_UPSELL[tier]
  return {
    tier,
    heading: data.heading ?? DEFAULT_UPSELL[tier].heading,
    intro: data.intro ?? DEFAULT_UPSELL[tier].intro,
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    cta_label: data.cta_label ?? 'Jetzt beitreten',
    cta_coming_soon: data.cta_coming_soon ?? true,
    cta_url: data.cta_url ?? null,
  }
}

// Admin bypass: echte Admins können immer alles
export function canAccessFeature(state: FeatureState, isAdmin: boolean): boolean {
  if (isAdmin) return true
  // 'paid' = Abo-Zugriff → Seite sichtbar, UI-Gate übernimmt die Aktions-Sperre
  return state === 'open' || state === 'coming_soon' || state === 'paid'
}

// Middleware-Gate: blockiert nur community (Tier-basiert). 'paid' wird NICHT
// blockiert — User kommt rein, sieht UI, die einzelnen Send/Generate-Buttons
// sind per Subscription-Gate im Client+Backend gesperrt.
export function requiresUpgrade(state: FeatureState): boolean {
  return state === 'community'
}
