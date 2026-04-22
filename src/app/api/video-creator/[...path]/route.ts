import { NextRequest, NextResponse } from 'next/server'

/**
 * Catch-all-Proxy zum Video-Creator-Worker (Hetzner).
 *
 * Läuft zur Request-Zeit — liest VIDEO_CREATOR_INTERNAL_URL bei jedem Call,
 * keine Build-Time-ENV-Probleme. Reicht Methode, Body, Query-String, Headers
 * (inkl. Authorization Bearer) 1:1 weiter und streamt die Response zurück.
 *
 * Pfad-Mapping:
 *   /api/video-creator/<path> → <WORKER>/api/<path>
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Upload-Dateien können groß sein — Body komplett durchreichen
export const maxDuration = 300 // 5 Min

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length', // wird von fetch neu gesetzt
])

function filterHeaders(src: Headers): Headers {
  const out = new Headers()
  src.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out.set(key, value)
  })
  return out
}

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const workerUrl = process.env.VIDEO_CREATOR_INTERNAL_URL
  if (!workerUrl) {
    return NextResponse.json(
      { error: 'VIDEO_CREATOR_INTERNAL_URL ist nicht konfiguriert' },
      { status: 500 },
    )
  }

  const { path } = await ctx.params
  const search = req.nextUrl.search
  const target = `${workerUrl.replace(/\/+$/, '')}/api/${path.join('/')}${search}`

  const headers = filterHeaders(req.headers)

  // Body nur bei Methoden mit Payload. Für grosse Uploads streamen.
  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = req.body ?? undefined
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
    // @ts-expect-error — duplex ist im Node-18+/undici erforderlich für Streaming-Body
    duplex: 'half',
  })

  const responseHeaders = filterHeaders(upstream.headers)
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
  handler as OPTIONS,
  handler as HEAD,
}
