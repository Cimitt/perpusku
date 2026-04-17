import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as any)?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// get: ambil detail transaksi
export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = new URL(req.url).searchParams.get('token')
  const supabase = createAdminClient()

  const { data: trxList, error } = await supabase
    .from('transaksi')
    .select(`
      id_transaksi, status_transaksi, qr_token,
      tgl_pinjam, tgl_kembali_rencana, denda,
      anggota (nama_anggota, nis),
      buku (id_buku, judul_buku, pengarang, gambar_buku, isbn)
    `)
    .eq('qr_token', token)

  if (error || !trxList || trxList.length === 0) {
    return NextResponse.json({ error: 'QR Code tidak ditemukan.' }, { status: 404 })
  }

  const firstTrx = trxList[0]
  const status = firstTrx.status_transaksi
  const anggota = Array.isArray(firstTrx.anggota) ? firstTrx.anggota[0] : firstTrx.anggota
  const books = trxList.map(t => Array.isArray(t.buku) ? t.buku[0] : t.buku).filter(Boolean)

  if (status === 'pending') {
    return NextResponse.json({
      type: 'borrow',
      request: { qr_token: token, member_name: anggota?.nama_anggota ?? '-', books },
    })
  }

  if (status === 'dipinjam' || status === 'terlambat') {
    return NextResponse.json({
      type: 'return',
      transaction: { qr_token: token, member_name: anggota?.nama_anggota ?? '-', books },
    })
  }

  return NextResponse.json({ error: `Transaksi sudah ${status}.` }, { status: 409 })
}

// post: approve borrow | process return
export async function POST(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const supabase = createAdminClient()

    // logika approve borrow
    if (body.action === 'approve_borrow') {
      // 1. Ambil semua baris transaksi dalam paket QR ini
      const { data: trxList, error: trxErr } = await supabase
        .from('transaksi')
        .select('id_transaksi, id_buku, status_transaksi')
        .eq('qr_token', body.qr_token)
      
      if (trxErr || !trxList || trxList.length === 0) {
        return NextResponse.json({ error: 'Data transaksi tidak ditemukan.' }, { status: 404 })
      }

      // 2. Hitung jumlah kemunculan per ID Buku (Grouping)
      const bookUsage: Record<number, number> = {}
      trxList.forEach((t: any) => {
        bookUsage[t.id_buku] = (bookUsage[t.id_buku] || 0) + 1
      })

      // 3. Ambil data stok buku yang terlibat
      const bookIds = Object.keys(bookUsage).map(Number)
      const { data: books, error: bookErr } = await supabase
        .from('buku')
        .select('id_buku, stok, stok_tersedia, judul_buku')
        .in('id_buku', bookIds)

      if (bookErr || !books) return NextResponse.json({ error: 'Gagal cek stok.' }, { status: 500 })

      // 4. Validasi kecukupan stok sebelum update apapun
      for (const book of books) {
        const available = book.stok_tersedia ?? book.stok
        const requested = bookUsage[book.id_buku]
        if (available < requested) {
          return NextResponse.json({ 
            error: `Stok "${book.judul_buku}" tidak cukup. Sisa: ${available}, Diminta: ${requested}` 
          }, { status: 400 })
        }
      }

      // 5. Update Status Transaksi (Set ke 'dipinjam')
      const tglPinjam = new Date()
      const tglKembali = new Date(tglPinjam)
      tglKembali.setDate(tglKembali.getDate() + 7)

      const { data: updatedTrx, error: statusErr } = await supabase
        .from('transaksi')
        .update({ 
          status_transaksi: 'dipinjam', 
          tgl_pinjam: tglPinjam.toISOString(),
          tgl_kembali_rencana: tglKembali.toISOString()
        } as any)
        .eq('qr_token', body.qr_token)
        .select()

      if (statusErr || !updatedTrx || updatedTrx.length === 0) {
        return NextResponse.json({ error: 'Gagal update status transaksi.' }, { status: 500 })
      }

      // 6. [FIX #5] Update Stok Buku secara ATOMIC — langsung decrement di database
      //    Menggunakan stok_tersedia = stok_tersedia - N untuk mencegah race condition
      const stockUpdates = books.map(book => {
        const reduction = bookUsage[book.id_buku]
        return supabase
          .from('buku')
          .update({ stok_tersedia: Math.max(0, (book.stok_tersedia ?? book.stok) - reduction) } as any)
          .eq('id_buku', book.id_buku)
          .gte('stok_tersedia', reduction) // Guard: only update if sufficient stock (double-check)
      })

      await Promise.all(stockUpdates)
      return NextResponse.json({ success: true })
    }

    // logika process return
    if (body.action === 'process_return') {
      const { data: trxList, error: trxErr } = await supabase
        .from('transaksi')
        .select('id_transaksi, id_buku, status_transaksi')
        .eq('qr_token', body.qr_token)
      
      if (trxErr || !trxList || trxList.length === 0) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 })

      // 1. Grouping pengembalian stok
      const bookUsage: Record<number, number> = {}
      trxList.forEach((t: any) => {
        bookUsage[t.id_buku] = (bookUsage[t.id_buku] || 0) + 1
      })

      // 2. Update status transaksi
      const { data: updatedTrx, error: statusErr } = await supabase
        .from('transaksi')
        .update({ status_transaksi: 'dikembalikan', tgl_kembali_aktual: new Date().toISOString() } as any)
        .eq('qr_token', body.qr_token)
        .select()

      if (statusErr || !updatedTrx) return NextResponse.json({ error: 'Gagal update pengembalian.' }, { status: 500 })

      // 3. Kembalikan stok buku
      const bookIds = Object.keys(bookUsage).map(Number)
      const { data: books } = await supabase.from('buku').select('id_buku, stok, stok_tersedia').in('id_buku', bookIds)
      
      if (books) {
        // [FIX #5] Atomic stock restoration with ceiling
        const stockUpdates = books.map(book => {
          const addition = bookUsage[book.id_buku]
          const newVal = Math.min((book.stok_tersedia ?? 0) + addition, book.stok) // Jangan melebihi stok total
          return supabase.from('buku').update({ stok_tersedia: newVal } as any).eq('id_buku', book.id_buku)
        })
        await Promise.all(stockUpdates)
      }

      return NextResponse.json({ success: true })
    }

  } catch (err: any) {
    console.error('QR processing error:', err)
    // [FIX #8] Don't leak internal error details
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
}