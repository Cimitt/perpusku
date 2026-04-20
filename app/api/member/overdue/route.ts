import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { hitungDenda } from '@/lib/fines'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

type PenggunaRow = Database['public']['Tables']['pengguna']['Row']
type AnggotaRow = Database['public']['Tables']['anggota']['Row']
type TransaksiRow = Database['public']['Tables']['transaksi']['Row']
type BukuRow = Database['public']['Tables']['buku']['Row']

interface PenggunaWithAnggota extends Pick<PenggunaRow, 'id_pengguna'> {
  anggota: Pick<AnggotaRow, 'id_anggota'> | null
}

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
  | 'created_at'
> & {
  buku: Pick<BukuRow, 'judul_buku' | 'pengarang' | 'gambar_buku'> | null
}

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

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idAnggota = await getIdAnggota(userId)
  if (!idAnggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transaksi')
    .select(`
      id_transaksi, id_anggota, id_buku,
      tgl_pinjam, tgl_kembali_rencana, tgl_kembali_aktual,
      status_transaksi, qr_token, denda, denda_dibayar, created_at,
      buku (judul_buku, pengarang, gambar_buku)
    `)
    .eq('id_anggota', idAnggota)
    .order('created_at', { ascending: false }) as unknown as {
      data: TransaksiWithBuku[] | null
      error: Error | null
    }

  if (error) {
    return NextResponse.json({ error: 'Gagal memuat data denda' }, { status: 500 })
  }

  const now = new Date()
  const overdueRows = (data ?? [])
    .map((trx) => {
      const dueDate = trx.tgl_kembali_rencana ? new Date(trx.tgl_kembali_rencana) : null
      const realtimeFine = dueDate ? hitungDenda(dueDate, now) : 0
      const activeOverdue =
        dueDate !== null &&
        dueDate.getTime() < now.getTime() &&
        ['dipinjam', 'terlambat'].includes(trx.status_transaksi)
      const unpaidStoredFine = (trx.denda ?? 0) > 0 && !trx.denda_dibayar
      const fine = Math.max(trx.denda ?? 0, activeOverdue ? realtimeFine : 0)

      return {
        ...trx,
        buku: Array.isArray(trx.buku) ? trx.buku[0] ?? null : trx.buku,
        hari_keterlambatan: dueDate
          ? Math.max(Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)), 0)
          : 0,
        denda_realtime: fine,
        is_active_overdue: activeOverdue,
        is_unpaid_fine: unpaidStoredFine,
      }
    })
    .filter((trx) => trx.denda_realtime > 0 && !trx.denda_dibayar)

  const totalDenda = overdueRows.reduce((sum, trx) => sum + trx.denda_realtime, 0)
  const maxDelay = overdueRows.reduce((max, trx) => Math.max(max, trx.hari_keterlambatan), 0)

  return NextResponse.json({
    data: overdueRows,
    summary: {
      total_denda: totalDenda,
      jumlah_transaksi: overdueRows.length,
      jumlah_buku_terlambat: overdueRows.filter((trx) => trx.is_active_overdue).length,
      keterlambatan_terlama: maxDelay,
    },
  })
}
