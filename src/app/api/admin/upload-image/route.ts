import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Auth: admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // Size + type validation
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei zu groß (max. 5MB)' }, { status: 400 })
  }
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Ungültiger Dateityp' }, { status: 400 })
  }

  // Upload via service role (bypasses RLS)
  const admin = createAdminClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `lesson-${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from('lesson-images')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: '31536000',
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('lesson-images').getPublicUrl(path)

  return NextResponse.json({
    url: publicUrl,
    markdown: `![${file.name.replace(/\.[^.]+$/, '')}](${publicUrl})`,
    path,
  })
}
