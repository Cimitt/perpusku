import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizePostgrestValue } from '@/lib/security'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// validation schemas
const BookBaseSchema = z.object({
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

const BookInsertSchema = BookBaseSchema.superRefine((data, ctx) => {
  if (data.stok_tersedia > data.stok) {
    ctx.addIssue({
      code: 'custom',
      path: ['stok_tersedia'],
      message: 'Stok tersedia tidak boleh melebihi stok total',
    })
  }
})

const BookUpdateSchema = BookBaseSchema.partial().superRefine((data, ctx) => {
  if (
    data.stok !== undefined &&
    data.stok_tersedia !== undefined &&
    data.stok_tersedia > data.stok
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['stok_tersedia'],
      message: 'Stok tersedia tidak boleh melebihi stok total',
    })
  }
})

function getBookStatus(stokTersedia: number): 'tersedia' | 'tidak' {
  return stokTersedia > 0 ? 'tersedia' : 'tidak'
}

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
  const categoryId = searchParams.get('category') ?? searchParams.get('categoryId')

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

  if (categoryId && !Number.isNaN(Number(categoryId))) {
    dbQuery = dbQuery.eq('id_kategori', Number(categoryId))
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
  const bookData = {
    ...parsed.data,
    stok_tersedia: parsed.data.stok,
    status: getBookStatus(parsed.data.stok),
  }

  const { data, error } = await supabase
    .from('buku')
    .insert(bookData)
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
  const { data: existingBook, error: findError } = await supabase
    .from('buku')
    .select('stok, stok_tersedia')
    .eq('id_buku', id)
    .single()

  if (findError || !existingBook) {
    return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 })
  }

  const borrowedCount = Math.max(
    0,
    (existingBook.stok ?? 0) - (existingBook.stok_tersedia ?? 0)
  )
  const nextStock = parsed.data.stok ?? existingBook.stok

  if (nextStock < borrowedCount) {
    return NextResponse.json(
      {
        error: `Stok total tidak boleh lebih kecil dari jumlah buku yang sedang dipinjam (${borrowedCount}).`,
      },
      { status: 400 }
    )
  }

  const nextAvailableStock =
    parsed.data.stok === undefined
      ? Math.min(existingBook.stok_tersedia ?? 0, nextStock)
      : nextStock - borrowedCount

  const updateData = {
    ...parsed.data,
    stok_tersedia: nextAvailableStock,
    status: getBookStatus(nextAvailableStock),
  }

  const { data, error } = await supabase
    .from('buku')
    .update(updateData)
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
