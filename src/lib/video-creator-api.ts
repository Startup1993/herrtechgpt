/**
 * Client-Lib für den Video-Creator-Worker (auf Hetzner).
 *
 * Der Worker validiert jeden Request via Supabase-JWT im Authorization-Header.
 * Diese Lib holt die aktuelle Session und injiziert den Access-Token automatisch.
 *
 * Usage (Client-Components):
 *   import { videoCreatorFetch } from '@/lib/video-creator-api'
 *   const { projects } = await videoCreatorFetch<{ projects: Project[] }>('/api/projects/list')
 */

import { createClient } from '@/lib/supabase/client'

// Der Video-Creator-Worker läuft auf Hetzner, wird aber transparent über
// Vercel-Rewrites unter /api/video-creator/* erreichbar gemacht (siehe
// next.config.ts). Aus Browser-Sicht gibt es nur die Hauptdomain — kein CORS,
// keine zweite URL, keine gesonderte ENV-Variable fürs Frontend.
const WORKER_BASE = '/api/video-creator'

export class VideoCreatorApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'VideoCreatorApiError'
    this.status = status
  }
}

export interface Scene {
  id: number
  start: number
  end: number
  text: string
  script: string
  imagePrompt: string | null
  manual: boolean
  screenshotFiles: string[]
  selectedScreenshot: string | null
  refImageFile: string | null
  characters: Array<{ label?: string; description?: string; imageFile?: string }>
  characterDescription: string | null
  characterImageFile: string | null
  imageFile: string | null
  imageApproved: boolean
  videoPrompt: string | null
  videoFile: string | null
  videoUrl: string | null
  videoApproved: boolean
  videoStatus?: 'generating' | 'done' | 'failed'
  videoModel?: 'kling' | 'veo3'
  videoRequestId?: string
  videoError?: string | null
  imageHistory?: string[]
  imageStatus?: string | null
}

export interface Project {
  id: string
  ownerId: string
  createdAt: string
  updatedAt?: string
  status: string
  title?: string | null
  videoPath?: string | null
  videoUrl?: string | null
  scenes?: Scene[]
  manualProject?: boolean
  promptInput?: string
  setup?: {
    format: '9:16' | '16:9' | '1:1'
    styleDescription: string
    styleDeviation: number
    subtitleLanguage: string
    subtitleColor: string
    subtitleFont: string
    subtitlePosition: string
    subtitleAnimation: string
  }
  ownerEmail?: string | null
  ownerName?: string | null
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new VideoCreatorApiError('Nicht eingeloggt', 401)
  }
  return { Authorization: `Bearer ${session.access_token}` }
}

/**
 * Fetch gegen den Worker. Injiziert Authorization-Header automatisch.
 * Body wird bei Objekten als JSON serialisiert; FormData wird durchgereicht.
 */
export async function videoCreatorFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const auth = await getAuthHeader()
  const isFormData = init.body instanceof FormData
  const isJson =
    init.body && !isFormData && typeof init.body === 'object'

  const headers: Record<string, string> = {
    ...auth,
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  }

  const body = isJson ? JSON.stringify(init.body) : (init.body as BodyInit)

  // path beginnt mit /api/... (worker-seitig), wir prefixen mit /api/video-creator/
  // und strippen das doppelte /api aus dem path.
  const workerPath = path.startsWith('/api/')
    ? path.slice('/api'.length) // '/api/projects/list' → '/projects/list'
    : path
  const res = await fetch(`${WORKER_BASE}${workerPath}`, {
    ...init,
    headers,
    body,
  })

  if (!res.ok) {
    let msg = `Worker error ${res.status}`
    try {
      const errBody = (await res.json()) as { error?: string }
      if (errBody.error) msg = errBody.error
    } catch {
      /* body nicht JSON — Default-Message */
    }
    throw new VideoCreatorApiError(msg, res.status)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return (await res.text()) as unknown as T
}

// ─── Typed Wrapper für häufige Calls ─────────────────────────────────────────

export const videoCreatorApi = {
  listProjects: () =>
    videoCreatorFetch<{ projects: Project[] }>('/api/projects/list'),

  getProject: (id: string) =>
    videoCreatorFetch<Project>(`/api/projects/${id}`),

  createFromPrompt: (prompt: string) =>
    videoCreatorFetch<{ projectId: string }>(
      '/api/projects/create-from-prompt',
      { method: 'POST', body: { prompt } as unknown as BodyInit },
    ),

  createManual: () =>
    videoCreatorFetch<{ projectId: string }>(
      '/api/projects/create-manual',
      { method: 'POST' },
    ),

  deleteProject: (id: string) =>
    videoCreatorFetch<{ ok: true }>(`/api/projects/${id}/delete`, {
      method: 'POST',
    }),

  renameProject: (id: string, title: string) =>
    videoCreatorFetch<{ ok: true }>(`/api/projects/${id}/rename`, {
      method: 'POST',
      body: { title } as unknown as BodyInit,
    }),

  uploadVideo: (file: File) => {
    const fd = new FormData()
    fd.append('video', file)
    return videoCreatorFetch<{ projectId: string; videoPath: string }>(
      '/api/upload',
      { method: 'POST', body: fd },
    )
  },
}

/**
 * Hilfs-Funktion: Media-URL vom Worker. Nutzbar in <img>/<video> src.
 * Das Worker-Media-Endpoint streamt direkt.
 */
export function workerMediaUrl(
  projectId: string,
  ...fileParts: string[]
): string {
  return `${WORKER_BASE}/projects/${projectId}/media/${fileParts.join('/')}`
}
