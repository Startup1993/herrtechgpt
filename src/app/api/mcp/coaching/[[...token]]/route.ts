import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { importBundle, type ImportPayload } from '@/lib/coaching/import'
import { exportEnrollment, listEnrollmentsCompact } from '@/lib/coaching/export'
import { getAppUrl } from '@/lib/urls'

export const maxDuration = 60

/**
 * Remote-MCP-Server fürs Coaching-Plugin (Streamable HTTP, zustandslos).
 *
 * Warum: Cowork und Claude Desktop lassen aus der Sandbox keine Verbindung zu
 * world.herr.tech zu. Ein Connector wird dagegen von Anthropics Infrastruktur
 * aufgerufen und kommt durch. Die Tools spiegeln die REST-Endpunkte
 * /api/coaching/import und /api/coaching/export.
 *
 * Auth: `Authorization: Bearer <COACHING_IMPORT_SECRET>` (Connector mit Request-Header)
 * oder, wenn der Connector-Dialog keine Header anbietet, das Secret als letztes
 * Pfadsegment: /api/mcp/coaching/<secret>.
 */

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']

type JsonRpcId = string | number | null
interface JsonRpcRequest { jsonrpc: '2.0'; id?: JsonRpcId; method: string; params?: Record<string, unknown> }

const TOOLS = [
  {
    name: 'cockpit_list',
    description: 'Alle Coaching-Teilnahmen kompakt (id, Name, E-Mail, Firma, Coach, Status, Track, Start, eingeladen, letzter Login). Zum Nachschlagen der enrollment-id oder E-Mail eines Kunden.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'cockpit_export',
    description: 'Eine Teilnahme komplett lesen: Stammdaten, Meilensteine (Kickoff, Calls, Check-in) mit Zusammenfassungen, alle Aufgaben (Kunde und Coach), Workflows mit Ampel, Material, Verlauf (WhatsApp, Notizen, Stimmung, Blocker, Erfolge) plus abgeleitete Werte (Phase, Fortschritt, nächster Termin, Signale). Genau eines von email, name oder id angeben. Vor jeder Call-Vorbereitung und für /coaching-status.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'E-Mail des Kunden (bevorzugt)' },
        name: { type: 'string', description: 'Teil des Namens, wenn keine E-Mail bekannt' },
        id: { type: 'string', description: 'enrollment-id aus cockpit_list' },
        since: { type: 'string', description: 'ISO-Zeitpunkt: Verlauf nur ab diesem Datum' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'cockpit_import',
    description: 'Ins Coaching-Cockpit schreiben (idempotent, alles optional, wird zusammengeführt). Vertrag und Feldnamen: skills/coaching-flow/COCKPIT_SYNC.md im Plugin. Teilnahme wird über enrollment.id, client_email oder client_name gefunden oder neu angelegt; Meilensteine über kind+number (milestone_ref "call:2"), Workflows und Material über title, Aufgaben über title innerhalb des Meilensteins. Antwort: enrollment_id, counts, dashboard_url, cockpit_url, invite_sent.',
    inputSchema: {
      type: 'object',
      properties: {
        author_name: { type: 'string', description: 'Wer schreibt, z. B. "Jacob (Plugin)"' },
        enrollment: {
          type: 'object',
          description: 'Stammdaten: client_email, client_name, company, coach_name (Jacob|Jonas|Flo), status (active|completed|paused), world_mode (program_only), starts_at, track, persona, north_star, success_quote, intro_text, notion_url, drive_url, whatsapp_url, upsell_status, case_study, nps, recommendation_*; create_account (bool), send_invite (bool)',
          additionalProperties: true,
        },
        goals: { type: 'array', description: 'Workflows: title, description, status (planned|in_progress|running|stuck), status_note, milestone_ref', items: { type: 'object', additionalProperties: true } },
        milestones: { type: 'array', description: 'Sessions: kind (kickoff|call|checkin|month), number, title, goal, scheduled_at, status (planned|scheduled|done|cancelled), summary, decisions, done_items, open_items, bring_along, recording_url, recap_url, meeting_url, with_cadence, change_reason', items: { type: 'object', additionalProperties: true } },
        tasks: { type: 'array', description: 'Aufgaben: milestone_ref, title, description, instructions, copy_prompt, link_url, due_at, assignee (client|coach), kind (homework|promise|cadence), status (open|done|skipped)', items: { type: 'object', additionalProperties: true } },
        materials: { type: 'array', description: 'Material: milestone_ref, kind (document|skill|video|link|prompt), title, description, version, external_url, visibility (internal|client), instructions', items: { type: 'object', additionalProperties: true } },
        events: { type: 'array', description: 'Verlauf: kind (whatsapp_in|whatsapp_out|note|schedule_change|plan_change|mood|client_win|client_blocker), body, mood_score (1-5), created_at, client_visible', items: { type: 'object', additionalProperties: true } },
      },
      required: ['enrollment'],
      additionalProperties: true,
    },
  },
]

function authorized(request: Request, pathToken: string | undefined): boolean {
  const secret = process.env.COACHING_IMPORT_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (bearer && bearer === secret) return true
  const apiKey = request.headers.get('x-api-key')?.trim() ?? ''
  if (apiKey && apiKey === secret) return true
  return !!pathToken && pathToken === secret
}

function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: '2.0', id, result }
}
function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}
function toolText(payload: unknown, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], isError }
}

async function callTool(name: string, args: Record<string, unknown>, request: Request) {
  const admin = createAdminClient()
  switch (name) {
    case 'cockpit_list':
      return toolText(await listEnrollmentsCompact(admin))
    case 'cockpit_export': {
      const result = await exportEnrollment(admin, {
        id: typeof args.id === 'string' ? args.id : null,
        email: typeof args.email === 'string' ? args.email : null,
        name: typeof args.name === 'string' ? args.name : null,
        since: typeof args.since === 'string' ? args.since : null,
      })
      if (!result) return toolText({ error: 'Teilnahme nicht gefunden. Erst cockpit_list aufrufen und E-Mail oder id prüfen.' }, true)
      return toolText(result)
    }
    case 'cockpit_import': {
      const payload = args as unknown as ImportPayload
      if (!payload || typeof payload !== 'object' || !payload.enrollment) {
        return toolText({ error: 'Es fehlt "enrollment" (mindestens client_email oder client_name).' }, true)
      }
      try {
        const result = await importBundle(admin, payload, getAppUrl(request))
        revalidatePath('/dashboard', 'layout')
        revalidatePath('/dashboard/coaching')
        revalidatePath('/dashboard/coaching/sessions')
        revalidatePath('/admin/coaching')
        revalidatePath(`/admin/coaching/${result.enrollment_id}`)
        return toolText(result)
      } catch (err) {
        return toolText({ error: err instanceof Error ? err.message : 'Import fehlgeschlagen' }, true)
      }
    }
    default:
      return toolText({ error: `Unbekanntes Tool: ${name}` }, true)
  }
}

async function handle(message: JsonRpcRequest, request: Request) {
  const id = message.id ?? null
  switch (message.method) {
    case 'initialize': {
      const requested = typeof message.params?.protocolVersion === 'string' ? message.params.protocolVersion : ''
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'coaching-cockpit', version: '1.0.0' },
        instructions: 'Coaching-Cockpit der Herr Tech World. cockpit_list zum Nachschlagen, cockpit_export vor jeder Vorbereitung, cockpit_import nach jeder Nachbereitung (idempotent). Feldvertrag: COCKPIT_SYNC.md im herr-tech-coaching-Plugin.',
      })
    }
    case 'ping':
      return rpcResult(id, {})
    case 'tools/list':
      return rpcResult(id, { tools: TOOLS })
    case 'tools/call': {
      const name = typeof message.params?.name === 'string' ? message.params.name : ''
      const args = (message.params?.arguments as Record<string, unknown> | undefined) ?? {}
      return rpcResult(id, await callTool(name, args, request))
    }
    case 'resources/list':
      return rpcResult(id, { resources: [] })
    case 'prompts/list':
      return rpcResult(id, { prompts: [] })
    default:
      return rpcError(id, -32601, `Methode nicht unterstützt: ${message.method}`)
  }
}

type Ctx = { params: Promise<{ token?: string[] }> }

async function pathToken(ctx: Ctx): Promise<string | undefined> {
  const { token } = await ctx.params
  return token?.[token.length - 1]
}

export async function POST(request: Request, ctx: Ctx) {
  if (!process.env.COACHING_IMPORT_SECRET) return NextResponse.json({ error: 'COACHING_IMPORT_SECRET ist nicht gesetzt' }, { status: 503 })
  if (!authorized(request, await pathToken(ctx))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="coaching-cockpit"' } })
  }

  const body = await request.json().catch(() => null) as JsonRpcRequest | JsonRpcRequest[] | null
  if (!body) return NextResponse.json(rpcError(null, -32700, 'Ungültiges JSON'), { status: 400 })

  const messages = Array.isArray(body) ? body : [body]
  // Notifications (ohne id) bekommen keine Antwort, nur 202.
  const requests = messages.filter((m) => m && typeof m.method === 'string' && m.id !== undefined && m.id !== null)
  if (requests.length === 0) return new Response(null, { status: 202 })

  const responses = await Promise.all(requests.map((m) => handle(m, request)))
  return NextResponse.json(Array.isArray(body) ? responses : responses[0], { headers: { 'Cache-Control': 'no-store' } })
}

/** Keine Server-Streams: der Client soll mit POST arbeiten. */
export async function GET(request: Request, ctx: Ctx) {
  if (!authorized(request, await pathToken(ctx))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="coaching-cockpit"' } })
  }
  return new Response(null, { status: 405, headers: { Allow: 'POST, DELETE' } })
}

export async function DELETE() {
  return new Response(null, { status: 200 })
}
