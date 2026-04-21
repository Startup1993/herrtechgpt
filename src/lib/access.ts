export type AccessTier = 'basic' | 'alumni' | 'premium'
export type ViewAsMode = 'admin' | AccessTier

export const VIEW_AS_COOKIE = 'view_as_tier'
export const VIEW_AS_OPTIONS: ViewAsMode[] = ['admin', 'premium', 'alumni', 'basic']

export interface EffectiveAccess {
  tier: AccessTier
  isAdmin: boolean
  realIsAdmin: boolean
  viewAs: ViewAsMode
}

function parseViewAs(raw: string | undefined | null): ViewAsMode {
  if (raw === 'admin' || raw === 'basic' || raw === 'alumni' || raw === 'premium') return raw
  return 'admin'
}

export function computeEffectiveAccess(
  profile: { role?: string | null; access_tier?: string | null } | null | undefined,
  viewAsRaw: string | undefined | null,
): EffectiveAccess {
  const realIsAdmin = profile?.role === 'admin'
  const rawTier = (profile?.access_tier ?? 'basic') as AccessTier
  const viewAs = realIsAdmin ? parseViewAs(viewAsRaw) : 'admin'

  if (!realIsAdmin || viewAs === 'admin') {
    return {
      tier: rawTier,
      isAdmin: realIsAdmin,
      realIsAdmin,
      viewAs: realIsAdmin ? 'admin' : 'admin',
    }
  }

  return {
    tier: viewAs,
    isAdmin: false,
    realIsAdmin,
    viewAs,
  }
}

export function canAccessClassroom(access: EffectiveAccess): boolean {
  return access.isAdmin || access.tier === 'premium' || access.tier === 'alumni'
}

export function canAccessChat(access: EffectiveAccess): boolean {
  return access.isAdmin || access.tier === 'premium'
}
