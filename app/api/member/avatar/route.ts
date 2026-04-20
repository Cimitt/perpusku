import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File avatar tidak ditemukan' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File avatar kosong' }, { status: 400 })
  }

  const ext = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]
  if (!ext) {
    return NextResponse.json({ error: 'Hanya JPG, PNG, dan WebP yang diperbolehkan' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5 MB' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `member-avatars/${safeUserId}/${fileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('book-covers')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = supabase.storage.from('book-covers').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl }, { status: 201 })
}
