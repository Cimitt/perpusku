import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'


type StatRow = Database['public']['Views']['v_statistik_dashboard']['Row']

type RawTrendRow = {
  tgl_pinjam: string | null
  status_transaksi: Database['public']['Enums']['status_transaksi'] | null
}

type TrendDataItem = {
  tanggal: string
  rawDate: string
  dipinjam: number
  kembali: number
  terlambat: number
}

// auth
async function requireAdmin(): Promise<string | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)
    ?.metadata?.role

  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}


export async function GET(request: Request) {
  try {
    const userId = await requireAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    const supabase = createAdminClient()

    const [
      { data: viewData, error: viewError },
      { count: kategorCount },
      { count: returnedCount },
      { count: totalTrxCount },
      { data: recentTransactions },
      { data: rawTrend },
    ] = await Promise.all([
      supabase
        .from('v_statistik_dashboard')
        .select('*')
        .single() as unknown as Promise<{ data: StatRow | null; error: Error | null }>,

      supabase
        .from('kategori')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('transaksi')
        .select('*', { count: 'exact', head: true })
        .eq('status_transaksi', 'dikembalikan'),

      supabase
        .from('transaksi')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('transaksi')
        .select(`
          id_transaksi,
          tgl_pinjam,
          tgl_kembali_rencana,
          status_transaksi,
          denda,
          anggota (nama_anggota, kelas),
          buku (judul_buku)
        `)
        .order('tgl_pinjam', { ascending: false })
        .limit(15),

      // Transaksi dalam N hari terakhir untuk grafik — select eksplisit kolom yang dipakai
      supabase
        .from('transaksi')
        .select('tgl_pinjam, status_transaksi')
        .gte('tgl_pinjam', startDateStr)
        .returns<RawTrendRow[]>(),
    ])

    if (viewError || !viewData) {
      return NextResponse.json(
        { error: viewError?.message ?? 'Gagal memuat data statistik' },
        { status: 500 }
      )
    }

    const trendData: TrendDataItem[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      trendData.push({
        tanggal: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        rawDate: d.toISOString().split('T')[0],
        dipinjam: 0,
        kembali: 0,
        terlambat: 0,
      })
    }

    if (rawTrend) {
      for (const trx of rawTrend) {
        if (!trx.tgl_pinjam || !trx.status_transaksi) continue

        const trxDate = trx.tgl_pinjam.split('T')[0]
        const targetDay = trendData.find((t) => t.rawDate === trxDate)
        if (!targetDay) continue

        const status = trx.status_transaksi
        if (status === 'dipinjam') {
          targetDay.dipinjam++
        } else if (status === 'dikembalikan' || status === 'kembali') {
          targetDay.kembali++
        } else if (status === 'terlambat') {
          targetDay.terlambat++
        }
      }
    }

    const d = viewData

    return NextResponse.json({
      members: {
        total_active:   d.anggota_aktif,
        total_inactive: d.total_anggota - d.anggota_aktif,
      },
      books: {
        total:       d.total_buku,
        available:   d.buku_tersedia,
        unavailable: d.total_buku - d.buku_tersedia,
        categories:  kategorCount ?? 0,
      },
      transactions: {
        active_loans: d.sedang_dipinjam,
        returned:     returnedCount ?? 0,
        overdue:      d.transaksi_terlambat,
        total:        totalTrxCount ?? 0,
        pending:
          (totalTrxCount ?? 0) -
          d.sedang_dipinjam -
          (returnedCount ?? 0) -
          d.transaksi_terlambat,
      },
      fines: {
        total_accumulated: d.total_denda_akumulasi,
        total_unpaid:      d.total_denda_belum_bayar,
      },
      recent_transactions: recentTransactions ?? [],
      trend_data: trendData,
    })
  } catch (err) {
    console.error('[DASHBOARD_API_ERROR]', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}