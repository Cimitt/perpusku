import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizePostgrestValue } from '@/lib/security'
import { z } from 'zod'

// validation schemas
const BookInsertSchema = z.object({
  judul_buku:     z.string().min(1, 'Judul wajib diisi'),
  id_kategori:    z.number().nullable().optional(),
  pengarang:      z.string().nullable().optional(),
  penerbit:       z.string().nullable().optional(),
  tahun_terbit:   z.number().int().min(1000).max(9999).nullable().optional(),
  isbn:           z.string().nullable().optional(),
  deskripsi_buku: z.string().nullable().optional(),
  gambar_buku:    z.string().nullable().optional(),
  stok:           z.number().int().min(0).default(1),
  stok_tersedia:  z.number().int().min(0).default(1),
})

const BookUpdateSchema = BookInsertSchema.partial()

// auth guard
async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)
    ?.metadata?.role

  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// get /api/admin/books
export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? ''

  let dbQuery = supabase
    .from('buku')
    .select('*, kategori(nama_kategori)')
    .order('created_at', { ascending: false })

  if (query.trim()) {
    const safe = sanitizePostgrestValue(query)
    dbQuery = dbQuery.or(
      `judul_buku.ilike.%${safe}%,pengarang.ilike.%${safe}%,isbn.ilike.%${safe}%`
    )
  }

  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// post /api/admin/books
export async function POST(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = BookInsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validasi gagal', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('buku')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}

// patch /api/admin/books?id=:id
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

  const body = await req.json()
  const parsed = BookUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validasi gagal', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('buku')
    .update(parsed.data)
    .eq('id_buku', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// delete /api/admin/books?id=:id
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('buku')
    .delete()
    .eq('id_buku', id)

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Buku masih terkait dengan transaksi, tidak dapat dihapus' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}