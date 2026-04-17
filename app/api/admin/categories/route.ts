import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// schema
const CategorySchema = z.object({
  nama_kategori: z.string().min(1, 'Nama kategori wajib diisi'),
  deskripsi:     z.string().nullable().optional(),
})

// auth guard
async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)
    ?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// get /api/admin/categories
export async function GET() {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await createAdminClient()
    .from('kategori')
    .select('*')
    .order('nama_kategori', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// post /api/admin/categories
export async function POST(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = CategorySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validasi gagal', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await createAdminClient()
    .from('kategori')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// patch /api/admin/categories?id=:id
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

  const parsed = CategorySchema.partial().safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validasi gagal', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await createAdminClient()
    .from('kategori')
    .update(parsed.data)
    .eq('id_kategori', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// delete /api/admin/categories?id=:id
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

  const { error } = await createAdminClient()
    .from('kategori')
    .delete()
    .eq('id_kategori', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}