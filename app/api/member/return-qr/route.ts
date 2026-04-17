import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as any)?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// get /api/admin/qr?token=xxx
export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 })

  const supabase = createAdminClient()

  // Tambahkan type casting 'as any' pada hasil query
  const { data, error } = await supabase
    .from('transaksi')
    .select(`
      id_transaksi, status_transaksi, qr_token,
      tgl_pinjam, tgl_kembali_rencana, denda,
      anggota (nama_anggota, nis),
      buku (id_buku, judul_buku, pengarang, gambar_buku, isbn)
    `)
    .eq('qr_token', token)

  const trxList = data as any[] | null;

  if (error || !trxList || trxList.length === 0) {
    return NextResponse.json(
      { error: 'QR Code tidak valid atau transaksi tidak ditemukan.' },
      { status: 404 }
    )
  }

  // Ambil data umum dari transaksi pertama
  const firstTrx = trxList[0]
  const status = firstTrx.status_transaksi
  const anggota = Array.isArray(firstTrx.anggota) ? firstTrx.anggota[0] : firstTrx.anggota
  
  // Kumpulkan semua buku ke dalam satu array
  const books = trxList.map(t => Array.isArray(t.buku) ? t.buku[0] : t.buku).filter(Boolean)

  if (status === 'pending') {
    return NextResponse.json({
      type: 'borrow',
      request: {
        qr_token:         token,
        member_name:      anggota?.nama_anggota ?? '-',
        member_nis:       anggota?.nis ?? '-',
        books:            books,
        due_date_preview: firstTrx.tgl_kembali_rencana,
      },
    })
  }

  if (status === 'dipinjam' || status === 'terlambat') {
    const totalDenda = trxList.reduce((sum, t) => sum + (t.denda ?? 0), 0)
    return NextResponse.json({
      type: 'return',
      fine: totalDenda,
      transaction: {
        qr_token:     token,
        member_name:  anggota?.nama_anggota ?? '-',
        member_nis:   anggota?.nis ?? '-',
        books:        books,
        borrow_date:  firstTrx.tgl_pinjam,
        due_date:     firstTrx.tgl_kembali_rencana,
      },
    })
  }

  return NextResponse.json(
    { error: `Paket Transaksi ini sudah ${status}.` },
    { status: 409 }
  )
}

// post /api/admin/qr — approve borrow | process return
export async function POST(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as any
  const supabase = createAdminClient()

  // approve borrow (validasi & kurangi stok)
  if (body.action === 'approve_borrow') {
    if (!body.qr_token) return NextResponse.json({ error: 'qr_token diperlukan' }, { status: 400 })

    const { data: rawTrxList, error: trxErr } = await supabase
      .from('transaksi').select('id_transaksi, id_buku, status_transaksi').eq('qr_token', body.qr_token)
    
    const trxList = rawTrxList as any[] | null;

    if (trxErr || !trxList || trxList.length === 0) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    if (trxList.some(t => t.status_transaksi !== 'pending')) return NextResponse.json({ error: 'Paket ini sudah diproses.' }, { status: 400 })

    const bookIds = trxList.map(t => t.id_buku)
    const { data: rawBooks } = await supabase.from('buku').select('id_buku, stok, judul_buku').in('id_buku', bookIds)
    const books = rawBooks as any[] | null;

    if (!books) return NextResponse.json({ error: 'Gagal mengecek stok' }, { status: 500 })

    for (const book of books) {
      if (book.stok <= 0) {
        return NextResponse.json({ error: `Stok "${book.judul_buku}" habis. Peminjaman gagal.` }, { status: 400 })
      }
    }

    // Gunakan 'as any' di payload update agar TS tidak protes soal tipe data 'never'
    const stockUpdates = books.map(book => supabase.from('buku').update({ stok: book.stok - 1 } as any).eq('id_buku', book.id_buku))
    const statusUpdate = supabase.from('transaksi').update({ status_transaksi: 'dipinjam', tgl_pinjam: new Date().toISOString() } as any).eq('qr_token', body.qr_token)

    await Promise.all([...stockUpdates, statusUpdate])
    return NextResponse.json({ success: true })
  }

  // process return (validasi double & tambah stok)
  if (body.action === 'process_return') {
    if (!body.qr_token) return NextResponse.json({ error: 'qr_token diperlukan' }, { status: 400 })

    const { data: rawTrxList, error: trxErr } = await supabase
      .from('transaksi').select('id_transaksi, id_buku, status_transaksi').eq('qr_token', body.qr_token)
    
    const trxList = rawTrxList as any[] | null;

    if (trxErr || !trxList || trxList.length === 0) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    if (trxList.some(t => t.status_transaksi === 'dikembalikan')) return NextResponse.json({ error: 'Paket ini sudah dikembalikan! Stok aman.' }, { status: 400 })

    const bookIds = trxList.map(t => t.id_buku)
    const { data: rawBooks } = await supabase.from('buku').select('id_buku, stok').in('id_buku', bookIds)
    const books = rawBooks as any[] | null;
    
    let stockUpdates: any[] = []
    if (books) {
      stockUpdates = books.map(book => supabase.from('buku').update({ stok: book.stok + 1 } as any).eq('id_buku', book.id_buku))
    }

    const statusUpdate = supabase.from('transaksi').update({ 
      status_transaksi: 'dikembalikan', 
      tgl_kembali_aktual: new Date().toISOString() 
    } as any).eq('qr_token', body.qr_token)

    await Promise.all([...stockUpdates, statusUpdate])
    return NextResponse.json({ success: true, fine: 0 }) 
  }

  return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
}