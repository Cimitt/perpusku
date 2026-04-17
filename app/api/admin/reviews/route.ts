import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// GET /api/admin/reviews
export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''

  let query = supabase
    .from('ulasan_buku')
    .select(`
      id_ulasan, rating, ulasan, created_at,
      anggota ( nama_anggota, nis ),
      buku ( judul_buku, pengarang, gambar_buku )
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`ulasan.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// DELETE /api/admin/reviews?id=xxx
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id ulasan diperlukan' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ulasan_buku')
    .delete()
    .eq('id_ulasan', Number(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
