import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'
import type { StatusTransaksi } from '@/types'

type PenggunaRow = Database['public']['Tables']['pengguna']['Row']
type AnggotaRow  = Database['public']['Tables']['anggota']['Row']
type TransaksiRow = Database['public']['Tables']['transaksi']['Row']
type BukuRow     = Database['public']['Tables']['buku']['Row']

interface PenggunaWithAnggota extends Pick<PenggunaRow, 'id_pengguna'> {
  anggota: Pick<AnggotaRow, 'id_anggota'> | null
}

// 1. TAMBAHKAN properti opsional jml_perpanjangan ke interface ini
type TransaksiWithBuku = Pick<
  TransaksiRow,
  | 'id_transaksi'
  | 'id_anggota'
  | 'id_buku'
  | 'tgl_pinjam'
  | 'tgl_kembali_rencana'
  | 'tgl_kembali_aktual'
  | 'status_transaksi'
  | 'qr_token'
  | 'denda'
  | 'denda_dibayar'
  | 'catatan'
  | 'created_at'
  | 'jml_perpanjangan'
> & {
  buku: Pick<BukuRow, 'judul_buku' | 'pengarang' | 'gambar_buku'> | null
}

const STATUS_TRANSAKSI = ['pending', 'dipinjam', 'dikembalikan', 'terlambat', 'dibatalkan'] as const

function isStatusTransaksi(value: string): value is StatusTransaksi {
  return STATUS_TRANSAKSI.includes(value as StatusTransaksi)
}

// helper — ambil id_anggota dari userid
async function getIdAnggota(userId: string): Promise<number | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('pengguna')
    .select('id_pengguna, anggota(id_anggota)')
    .eq('clerk_id', userId)
    .single() as unknown as { data: PenggunaWithAnggota | null }

  const anggota = Array.isArray(data?.anggota) ? data!.anggota[0] : data?.anggota
  return (anggota as Pick<AnggotaRow, 'id_anggota'> | null)?.id_anggota ?? null
}

// get /api/member/loans?status=
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idAnggota = await getIdAnggota(userId)
  if (!idAnggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

  const status  = new URL(req.url).searchParams.get('status') ?? 'all'
  const supabase = createAdminClient()

  // 2. TAMBAHKAN jml_perpanjangan di dalam block .select()
  let query = supabase
    .from('transaksi')
    .select(`
      id_transaksi, id_anggota, id_buku,
      tgl_pinjam, tgl_kembali_rencana, tgl_kembali_aktual,
      status_transaksi, qr_token, denda, denda_dibayar, catatan, created_at, jml_perpanjangan,
      buku (judul_buku, pengarang, gambar_buku)
    `)
    .eq('id_anggota', idAnggota)
    .order('created_at', { ascending: false })

  if (status !== 'all' && isStatusTransaksi(status)) {
    query = query.eq('status_transaksi', status)
  }

  const { data, error } = await query as unknown as {
    data: TransaksiWithBuku[] | null
    error: Error | null
  }

  if (error) return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map((t) => ({
      ...t,
      buku: Array.isArray(t.buku) ? t.buku[0] ?? null : t.buku,
    })),
  })
}

// patch /api/member/loans?id=:id — batalkan transaksi
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

  const idAnggota = await getIdAnggota(userId)
  if (!idAnggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

  const supabase = createAdminClient()

  // Pastikan transaksi milik anggota ini & statusnya pending
  const { data: trx } = await supabase
    .from('transaksi')
    .select('id_transaksi, status_transaksi, id_anggota')
    .eq('id_transaksi', id)
    .eq('id_anggota', idAnggota)
    .single() as unknown as {
      data: Pick<TransaksiRow, 'id_transaksi' | 'status_transaksi' | 'id_anggota'> | null
    }

  if (!trx) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
  if (trx.status_transaksi !== 'pending') {
    return NextResponse.json(
      { error: 'Hanya transaksi pending yang bisa dibatalkan' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('transaksi')
    .update({ status_transaksi: 'dibatalkan' as const })
    .eq('id_transaksi', id)

  if (error) return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  return NextResponse.json({ success: true })
}
