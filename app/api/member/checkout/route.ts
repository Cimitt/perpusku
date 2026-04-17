import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { randomUUID } from 'crypto' 

const CheckoutSchema = z.object({
  book_ids: z.array(z.number().int().positive()).min(1, 'Keranjang kosong'),
})

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

    // 1. Ambil id_anggota
    const { data: pengguna, error: pErr } = await supabase
      .from('pengguna')
      .select('id_pengguna, anggota(id_anggota)')
      .eq('clerk_id', userId)
      .single() as any

    if (pErr || !pengguna) {
      console.error('Checkout Error [User]:', pErr)
      return NextResponse.json({ error: 'Data anggota tidak ditemukan.' }, { status: 404 })
    }

    const idAnggota = Array.isArray(pengguna.anggota) 
      ? pengguna.anggota[0]?.id_anggota 
      : pengguna.anggota?.id_anggota

    if (!idAnggota) return NextResponse.json({ error: 'ID Anggota kosong.' }, { status: 404 })

    // 2. Cek apakah anggota memiliki denda belum lunas
    const { data: dendaAktif } = await supabase
      .from('transaksi')
      .select('id_transaksi, denda')
      .eq('id_anggota', idAnggota)
      .gt('denda', 0)
      .eq('denda_dibayar', false) as any

    if (dendaAktif && dendaAktif.length > 0) {
      const totalDenda = dendaAktif.reduce((sum: number, t: any) => sum + (t.denda || 0), 0)
      return NextResponse.json({
        error: `Kamu memiliki denda belum lunas sebesar Rp ${totalDenda.toLocaleString('id-ID')}. Silakan lunasi terlebih dahulu sebelum meminjam buku.`,
        denda_aktif: true,
        total_denda: totalDenda,
      }, { status: 403 })
    }

    // 2. Hitung jumlah permintaan per buku (grouping duplikat)
    const bookUsage: Record<number, number> = {}
    book_ids.forEach(id => {
      bookUsage[id] = (bookUsage[id] || 0) + 1
    })
    const uniqueBookIds = Object.keys(bookUsage).map(Number)

    // 3. Cek Stok (Validasi terakhir)
    const { data: bukuList, error: bErr } = await supabase
      .from('buku')
      .select('id_buku, judul_buku, stok_tersedia')
      .in('id_buku', uniqueBookIds)

    if (bErr) {
      console.error('Checkout Error [Buku]:', bErr)
      return NextResponse.json({ error: 'Gagal cek stok.' }, { status: 500 })
    }

    // 4. Validasi kecukupan stok sebelum insert
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

    // 5. Persiapkan Insert
    const sharedToken = randomUUID()
    const inserts = book_ids.map(id => ({
      id_anggota: idAnggota,
      id_buku: id,
      status_transaksi: 'pending',
      qr_token: sharedToken,
      qr_action: 'pinjam'
    }))

    // Data ready for insert (sensitive data not logged)

    // 6. Eksekusi Insert
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