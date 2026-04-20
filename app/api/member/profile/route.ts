import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const ProfileSchema = z.object({
  nama_anggota: z.string().min(1).max(50),
  nis:          z.string().max(20).nullable(),
  kelas:        z.string().max(20).nullable(),
  nomor_hp:     z.string().max(30).regex(/^[0-9+\-\s()]+$/, 'Nomor HP tidak valid').nullable().optional(),
  avatar_url:   z.string().url('URL avatar tidak valid').max(1000).nullable().optional(),
  email:        z.string().email().nullable().optional(),
})

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('pengguna')
    .select('id_pengguna, email, nama_pengguna, level, is_active, anggota(id_anggota, nama_anggota, nis, kelas, foto, avatar_url, nomor_hp, email)')
    .eq('clerk_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })

  const anggotaRaw = Array.isArray(data.anggota) ? data.anggota[0] : data.anggota
  return NextResponse.json({ ...data, anggota: anggotaRaw })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = ProfileSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Ambil id_anggota
  const { data: penggunaData } = await supabase
    .from('pengguna')
    .select('id_pengguna, anggota(id_anggota)')
    .eq('clerk_id', userId)
    .single()

  if (!penggunaData) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })

  const anggotaRaw = Array.isArray(penggunaData.anggota) ? penggunaData.anggota[0] : penggunaData.anggota
  const id_anggota = (anggotaRaw as { id_anggota: number } | null)?.id_anggota

  if (!id_anggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

  const { nama_anggota, nis, kelas, nomor_hp, avatar_url } = parsed.data

  const { error } = await supabase
    .from('anggota')
    .update({
      nama_anggota,
      nis,
      kelas,
      nomor_hp: nomor_hp ?? null,
      avatar_url: avatar_url ?? null,
      foto: avatar_url ?? null,
    })
    .eq('id_anggota', id_anggota)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync nama ke tabel pengguna
  await supabase
    .from('pengguna')
    .update({ nama_pengguna: nama_anggota })
    .eq('clerk_id', userId)

  return NextResponse.json({ success: true })
}
