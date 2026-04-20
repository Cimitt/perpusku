import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hitungDenda } from '@/lib/fines'
import { z } from 'zod'
import { randomUUID } from 'crypto' 

const CheckoutSchema = z.object({
  book_ids: z.array(z.number().int().positive()).min(1, 'Keranjang kosong'),
})

type BlockingTransaction = {
  id_transaksi: number
  denda: number | null
  denda_dibayar?: boolean | null
  status_transaksi: string
  tgl_kembali_rencana: string | null
}

function buildBorrowBlockPayload(
  unpaidFines: BlockingTransaction[] = [],
  overdueLoans: BlockingTransaction[] = [],
) {
  const blockedTransactions = new Map<number, number>()

  for (const trx of unpaidFines) {
    blockedTransactions.set(trx.id_transaksi, Math.max(trx.denda ?? 0, 0))
  }

  for (const trx of overdueLoans) {
    const realtimeFine = trx.tgl_kembali_rencana ? hitungDenda(trx.tgl_kembali_rencana) : 0
    const currentFine = blockedTransactions.get(trx.id_transaksi) ?? 0
    blockedTransactions.set(trx.id_transaksi, Math.max(currentFine, trx.denda ?? 0, realtimeFine))
  }

  const totalDenda = Array.from(blockedTransactions.values()).reduce((sum, fine) => sum + fine, 0)
  const hasOverdueLoans = overdueLoans.length > 0
  const hasUnpaidFines = unpaidFines.length > 0

  if (!hasOverdueLoans && !hasUnpaidFines) return null

  const reasons = [
    hasOverdueLoans ? `${overdueLoans.length} buku terlambat` : null,
    hasUnpaidFines ? `${unpaidFines.length} denda belum lunas` : null,
  ].filter(Boolean)

  return {
    error: totalDenda > 0
      ? `Kamu belum bisa mengajukan peminjaman karena memiliki ${reasons.join(' dan ')} sebesar Rp ${totalDenda.toLocaleString('id-ID')}. Silakan selesaikan pembayaran denda terlebih dahulu.`
      : `Kamu belum bisa mengajukan peminjaman karena memiliki ${reasons.join(' dan ')}. Silakan selesaikan administrasi terlebih dahulu.`,
    peminjaman_diblokir: true,
    denda_aktif: true,
    keterlambatan_aktif: hasOverdueLoans,
    total_denda: totalDenda,
    jumlah_denda_belum_lunas: unpaidFines.length,
    jumlah_keterlambatan: overdueLoans.length,
    redirect_to: '/members/overdue',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = CheckoutSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validasi gagal' }, { status: 400 })
    }

    const { book_ids } = parsed.data
    const supabase = createAdminClient()

    // 1. Ambil data anggota
    const { data: pengguna, error: pErr } = await supabase
      .from('pengguna')
      .select('id_pengguna, anggota(id_anggota, nis, kelas, nomor_hp)')
      .eq('clerk_id', userId)
      .single() as any

    if (pErr || !pengguna) {
      console.error('Checkout Error [User]:', pErr)
      return NextResponse.json({ error: 'Data anggota tidak ditemukan.' }, { status: 404 })
    }

    const anggota = Array.isArray(pengguna.anggota)
      ? pengguna.anggota[0]
      : pengguna.anggota

    const idAnggota = anggota?.id_anggota

    if (!idAnggota) return NextResponse.json({ error: 'ID Anggota kosong.' }, { status: 404 })

    const requiredProfileFields = [
      { key: 'nis', label: 'NIS', value: anggota?.nis },
      { key: 'kelas', label: 'Kelas', value: anggota?.kelas },
      { key: 'nomor_hp', label: 'Nomor HP', value: anggota?.nomor_hp },
    ]
    const missingFields = requiredProfileFields
      .filter(field => typeof field.value !== 'string' || field.value.trim().length === 0)
      .map(field => field.label)

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Lengkapi profil terlebih dahulu: ${missingFields.join(', ')}.`,
        profile_incomplete: true,
        missing_fields: missingFields,
        redirect_to: '/members/profile',
      }, { status: 403 })
    }

    // 2. Cek apakah anggota memiliki denda belum lunas atau pinjaman terlambat
    const { data: dendaAktif, error: dendaErr } = await supabase
      .from('transaksi')
      .select('id_transaksi, denda, status_transaksi, tgl_kembali_rencana')
      .eq('id_anggota', idAnggota)
      .gt('denda', 0)
      .eq('denda_dibayar', false) as any

    if (dendaErr) {
      console.error('Checkout Error [Denda]:', dendaErr)
      return NextResponse.json({ error: 'Gagal memeriksa status denda.' }, { status: 500 })
    }

    const { data: kandidatPinjamanAktif, error: terlambatErr } = await supabase
      .from('transaksi')
      .select('id_transaksi, denda, denda_dibayar, status_transaksi, tgl_kembali_rencana')
      .eq('id_anggota', idAnggota)
      .in('status_transaksi', ['dipinjam', 'terlambat']) as any

    if (terlambatErr) {
      console.error('Checkout Error [Terlambat]:', terlambatErr)
      return NextResponse.json({ error: 'Gagal memeriksa status keterlambatan.' }, { status: 500 })
    }

    const now = new Date()
    const pinjamanTerlambat = (kandidatPinjamanAktif ?? []).filter((trx: BlockingTransaction) => {
      if (trx.status_transaksi === 'terlambat') return true
      if (!trx.tgl_kembali_rencana) return false
      return new Date(trx.tgl_kembali_rencana).getTime() < now.getTime()
    })

    const borrowBlockPayload = buildBorrowBlockPayload(dendaAktif ?? [], pinjamanTerlambat ?? [])
    if (borrowBlockPayload) {
      return NextResponse.json(borrowBlockPayload, { status: 403 })
    }

    // 3. Hitung jumlah permintaan per buku (grouping duplikat)
    const bookUsage: Record<number, number> = {}
    book_ids.forEach(id => {
      bookUsage[id] = (bookUsage[id] || 0) + 1
    })
    const uniqueBookIds = Object.keys(bookUsage).map(Number)

    // 4. Cek Stok (Validasi terakhir)
    const { data: bukuList, error: bErr } = await supabase
      .from('buku')
      .select('id_buku, judul_buku, stok_tersedia')
      .in('id_buku', uniqueBookIds)

    if (bErr) {
      console.error('Checkout Error [Buku]:', bErr)
      return NextResponse.json({ error: 'Gagal cek stok.' }, { status: 500 })
    }

    // 5. Validasi kecukupan stok sebelum insert
    const stokHabis: number[] = []
    const errorMessages: string[] = []

    for (const buku of (bukuList || [])) {
      const requested = bookUsage[buku.id_buku] || 0
      const available = buku.stok_tersedia ?? 0
      if (available < requested) {
        stokHabis.push(buku.id_buku)
        errorMessages.push(`"${buku.judul_buku}" (sisa: ${available}, diminta: ${requested})`)
      }
    }

    // Cek apakah ada buku yang tidak ditemukan di database
    const foundIds = new Set((bukuList || []).map(b => b.id_buku))
    for (const id of uniqueBookIds) {
      if (!foundIds.has(id)) {
        stokHabis.push(id)
        errorMessages.push(`Buku ID ${id} tidak ditemukan`)
      }
    }

    if (stokHabis.length > 0) {
      return NextResponse.json({
        error: `Stok tidak mencukupi: ${errorMessages.join(', ')}`,
        stok_habis: stokHabis,
      }, { status: 400 })
    }

    // 6. Persiapkan Insert
    const sharedToken = randomUUID()
    const inserts = book_ids.map(id => ({
      id_anggota: idAnggota,
      id_buku: id,
      status_transaksi: 'pending',
      qr_token: sharedToken,
      qr_action: 'pinjam'
    }))

    // Data ready for insert (sensitive data not logged)

    // 7. Eksekusi Insert
    const { data: txData, error: txErr } = await (supabase.from('transaksi') as any)
      .insert(inserts)
      .select()

    if (txErr) {
      // INI BAGIAN PALING PENTING: Cek log di terminal Next.js kamu!
      console.error('DATABASE INSERT ERROR:', txErr) 
      return NextResponse.json({ error: txErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${book_ids.length} buku berhasil diajukan.`,
      qr_token: sharedToken
    }, { status: 201 })

  } catch (error: any) {
    console.error('CRITICAL CHECKOUT ERROR:', error)
    // [FIX #8] Don't leak internal error details to client
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
