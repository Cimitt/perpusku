import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sanitizePostgrestValue } from '@/lib/security'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('category')

  // [FIX #10] Use RLS-aware client for member-facing read-only route
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('buku')
    .select('id_buku, judul_buku, pengarang, gambar_buku, deskripsi_buku, tahun_terbit, stok_tersedia, status, kategori(nama_kategori)')
    .order('created_at', { ascending: false })

  if (q.trim()) {
    const safe = sanitizePostgrestValue(q)
    query = query.ilike('judul_buku', `%${safe}%`)
  }

  if (categoryId && !isNaN(Number(categoryId))) {
    query = query.eq('id_kategori', Number(categoryId))
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Gagal memuat katalog' }, { status: 500 })

  return NextResponse.json({
    data: (data || []).map((b: any) => ({
      ...b,
      kategori: Array.isArray(b.kategori) ? b.kategori[0] ?? null : b.kategori,
    })),
  })
}