// app/api/member/me/route.ts
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

type PenggunaRow = Database['public']['Tables']['pengguna']['Row']
type AnggotaRow  = Database['public']['Tables']['anggota']['Row']

interface PenggunaWithAnggota extends PenggunaRow {
  anggota: Pick<AnggotaRow, 'id_anggota' | 'nama_anggota' | 'nis' | 'kelas' | 'foto'> | null
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // 1. Coba cari user di Supabase
  const { data, error } = await supabase
    .from('pengguna')
    .select('id_pengguna, level, is_active, anggota(id_anggota, nama_anggota, nis, kelas, foto)')
    .eq('clerk_id', userId)
    .single() as unknown as { data: PenggunaWithAnggota | null; error: any }

  // 2. Jika user SUDAH ADA, langsung kembalikan datanya
  if (data && !error) {
    const anggota = Array.isArray(data.anggota) ? data.anggota[0] ?? null : data.anggota
    return NextResponse.json({
      id_pengguna:  data.id_pengguna,
      level:        data.level,
      is_active:    data.is_active,
      id_anggota:   anggota?.id_anggota   ?? null,
      nama_anggota: anggota?.nama_anggota ?? null,
      nis:          anggota?.nis          ?? null,
      kelas:        anggota?.kelas        ?? null,
      foto:         anggota?.foto         ?? null,
    })
  }

  // 3. JIKA USER TIDAK DITEMUKAN -> Lakukan Auto-Insert dari profil Clerk
  const clerkUser = await currentUser()
  if (!clerkUser) return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 })

  const email = clerkUser.emailAddresses[0]?.emailAddress || ''
  const nama = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Pengguna Baru'
  const fotoUrl = clerkUser.imageUrl || null

  try {
    // FIX: Gunakan variabel dengan tipe 'any' untuk mem-bypass error 'never' pada .insert()
    const payloadPengguna: any = {
      clerk_id: userId,
      email: email,
      nama_pengguna: nama,
      level: 'Anggota',
      is_active: true
    }

    // FIX: Gunakan 'as any' pada hasil akhir agar TypeScript tidak protes soal properti yang hilang
    const { data: newPengguna, error: errPengguna } = await supabase
      .from('pengguna')
      .insert(payloadPengguna)
      .select('id_pengguna, level, is_active')
      .single() as any

    if (errPengguna || !newPengguna) throw errPengguna

    // Lakukan hal yang sama untuk tabel anggota
    const payloadAnggota: any = {
      id_pengguna: newPengguna.id_pengguna,
      nama_anggota: nama,
      email: email,
      foto: fotoUrl
    }

    const { data: newAnggota, error: errAnggota } = await supabase
      .from('anggota')
      .insert(payloadAnggota)
      .select('id_anggota, nama_anggota, nis, kelas, foto')
      .single() as any

    if (errAnggota) throw errAnggota

    return NextResponse.json({
      id_pengguna:  newPengguna.id_pengguna,
      level:        newPengguna.level,
      is_active:    newPengguna.is_active,
      id_anggota:   newAnggota?.id_anggota,
      nama_anggota: newAnggota?.nama_anggota,
      nis:          newAnggota?.nis,
      kelas:        newAnggota?.kelas,
      foto:         newAnggota?.foto,
    })

  } catch (insertError: any) {
    console.error('Auto-sync error:', insertError)
    return NextResponse.json({ error: 'Gagal sinkronisasi data pengguna baru' }, { status: 500 })
  }
}