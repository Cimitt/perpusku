import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    // 1. Autentikasi User (Hanya member yang login yang bisa akses)
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Ambil Payload
    const body = await req.json()
    const qr_token = body.qr_token
    if (!qr_token) return NextResponse.json({ error: "Token diperlukan" }, { status: 400 })

    const supabase = createAdminClient() // Pakai admin client agar bisa nembus RLS database

    // 3. Cari Data Transaksi Berdasarkan QR Token
    const { data: rawTrx, error: trxError } = await supabase
      .from('transaksi')
      .select('id_transaksi, id_anggota, status_transaksi, tgl_kembali_rencana, jml_perpanjangan')
      .eq('qr_token', qr_token)

    const trxList = rawTrx as any[] | null;

    if (trxError || !trxList || trxList.length === 0) {
      return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 })
    }

    // 4. Ambil data transaksi pertama
    const firstTrx = trxList[0]

    // 5. [FIX #4] Verify ownership — ensure this QR token belongs to the authenticated user
    const { data: pengguna } = await supabase
      .from('pengguna')
      .select('id_pengguna, anggota(id_anggota)')
      .eq('clerk_id', userId)
      .single() as any

    if (!pengguna) {
      return NextResponse.json({ error: "Data anggota tidak ditemukan" }, { status: 404 })
    }

    const userAnggotaId = Array.isArray(pengguna.anggota)
      ? pengguna.anggota[0]?.id_anggota
      : pengguna.anggota?.id_anggota

    const trxAnggotaId = firstTrx.id_anggota

    if (!userAnggotaId || userAnggotaId !== trxAnggotaId) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke transaksi ini" }, { status: 403 })
    }

    // 6. Validasi Aturan Main (Hanya bisa perpanjang buku yang "dipinjam" dan maks 1x)
    
    if (firstTrx.status_transaksi !== 'dipinjam') {
      return NextResponse.json({ error: "Hanya buku yang sedang dipinjam yang bisa diperpanjang." }, { status: 400 })
    }
    
    if (firstTrx.jml_perpanjangan >= 1) {
      return NextResponse.json({ 
        error: "Batas perpanjangan habis (Maksimal 1x). Silakan kembalikan buku ke perpustakaan." 
      }, { status: 403 })
    }

    // 6. Eksekusi Perpanjangan (+7 Hari dari deadline saat ini)
    const currentDeadline = new Date(firstTrx.tgl_kembali_rencana)
    const newDeadline = new Date(currentDeadline)
    newDeadline.setDate(newDeadline.getDate() + 7)

    // Update seluruh buku di dalam paket/keranjang tersebut
    const { error: updateError } = await supabase
      .from('transaksi')
      .update({ 
        tgl_kembali_rencana: newDeadline.toISOString(),
        jml_perpanjangan: firstTrx.jml_perpanjangan + 1 
      } as any)
      .eq('qr_token', qr_token)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: "Berhasil diperpanjang selama 7 hari!" })

  } catch (error: any) {
    console.error('Extend error:', error)
    // [FIX #8] Don't leak internal error details
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}