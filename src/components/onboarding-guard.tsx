'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface OnboardingGuardProps {
  profileComplete: boolean
}

const SKIP_PATHS = ['/assistants/onboarding', '/assistants/profile']

export function OnboardingGuard({ profileComplete }: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!profileComplete && !SKIP_PATHS.some((p) => pathname.startsWith(p))) {
      router.push('/assistants/onboarding')
    }
  }, [profileComplete, pathname, router])

  return null
}
