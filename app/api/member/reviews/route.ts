import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const ReviewSchema = z.object({
  id_buku: z.number().int().positive(),
  rating:  z.number().int().min(1).max(5),
  ulasan:  z.string().min(1, 'Ulasan tidak boleh kosong'),
})

async function getAnggota(clerkId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('pengguna')
    .select('id_pengguna, anggota(id_anggota)')
    .eq('clerk_id', clerkId)
    .single()

  if (!data) return null
  const anggotaRaw = Array.isArray(data.anggota) ? data.anggota[0] : data.anggota
  return (anggotaRaw as { id_anggota: number } | null)?.id_anggota ?? null
}

// GET /api/member/reviews?buku_id=xxx
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const buku_id = searchParams.get('buku_id')
  const my_reviews = searchParams.get('my_reviews')

  if (my_reviews === 'true') {
    // [FIX #10] Use RLS-aware client for member's own reviews
    const supabase = await createServerSupabaseClient()
    const id_anggota = await getAnggota(userId)
    if (!id_anggota) return NextResponse.json({ data: [] })

    const { data, error } = await supabase
      .from('ulasan_buku')
      .select('*, buku(judul_buku, gambar_buku, pengarang)')
      .eq('id_anggota', id_anggota)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Gagal memuat ulasan' }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (buku_id) {
    // Admin client diperlukan agar join ke tabel anggota tidak diblokir oleh RLS
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ulasan_buku')
      .select('*, anggota(nama_anggota)')
      .eq('id_buku', Number(buku_id))
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Gagal memuat ulasan' }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ data: [] })
}

// POST /api/member/reviews
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = ReviewSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 })
  }

  const id_anggota = await getAnggota(userId)
  if (!id_anggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

  const supabase = createAdminClient() // Admin client needed for upsert across users
  const { data, error } = await supabase
    .from('ulasan_buku')
    .upsert({ id_anggota, ...parsed.data }, { onConflict: 'id_anggota,id_buku' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Gagal menyimpan ulasan' }, { status: 500 })
  return NextResponse.json({ success: true, data }, { status: 201 })
}

// DELETE /api/member/reviews?id=xxx
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id_anggota = await getAnggota(userId)
  if (!id_anggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id ulasan diperlukan' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ulasan_buku')
    .delete()
    .eq('id_ulasan', Number(id))
    .eq('id_anggota', id_anggota)

  if (error) return NextResponse.json({ error: 'Gagal menghapus ulasan' }, { status: 500 })
  return NextResponse.json({ success: true })
}
