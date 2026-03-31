'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const SKIP_PATHS = ['/assistants/onboarding', '/assistants/profile']
const STORAGE_KEY = 'herr_tech_onboarding_done'

interface OnboardingGuardProps {
  profileComplete: boolean
}

export function OnboardingGuard({ profileComplete }: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const alreadySeen = localStorage.getItem(STORAGE_KEY)
    if (alreadySeen) return // User has seen onboarding before — never show again

    if (!profileComplete && !SKIP_PATHS.some((p) => pathname.startsWith(p))) {
      router.push('/assistants/onboarding')
    }
  }, [profileComplete, pathname, router])

  return null
}
