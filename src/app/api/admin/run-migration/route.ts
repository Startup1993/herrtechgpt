import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import fs from 'fs/promises'
import path from 'path'

// One-time migration runner. DELETE after use!
export async function POST(req: Request) {
  try {
    const { migrationFile } = await req.json()
    if (!migrationFile) {
      return NextResponse.json({ error: 'migrationFile required' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)
    const sql = await fs.readFile(filePath, 'utf8')

    const admin = createAdminClient()
    // Supabase JS client doesn't support raw DDL via .from() — we need to use rpc or HTTP call
    // Use fetch to Supabase REST API directly with service role key
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Try executing via PostgREST function call
    // Note: this requires a SQL execution function on the DB side
    // Alternative: split SQL by statements and run via rpc

    // Easier approach: use postgres-js to execute directly
    // For now, return the SQL so user can run it manually
    return NextResponse.json({
      success: false,
      message: 'Bitte führe diese Migration manuell im Supabase SQL Editor aus.',
      sqlPath: filePath,
      url: `${url}/project/_/sql`,
      instruction: 'Öffne den SQL Editor auf Supabase, kopiere den Inhalt der Migration-Datei und führe ihn aus.',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
