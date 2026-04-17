'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// 1. Definisikan Interface agar TypeScript tidak bingung
interface TransaksiBaris {
  id_transaksi: number;
  status_transaksi: string;
  qr_token: string;
  tgl_pinjam: string | null;
  tgl_kembali_rencana: string | null;
  denda: number;
  anggota: { nama_anggota: string; nis: string } | any;
  buku: { id_buku: number; judul_buku: string; pengarang: string; gambar_buku: string; isbn: string } | any;
}

export async function scanQRServer(qrToken: string) {
  const supabase = createAdminClient()
  
  // Gunakan casting 'as any' atau hubungkan ke tipe database jika ada
  const { data, error } = await supabase
    .from('transaksi')
    .select(`
      id_transaksi, status_transaksi, qr_token,
      tgl_pinjam, tgl_kembali_rencana, denda,
      anggota (nama_anggota, nis),
      buku (id_buku, judul_buku, pengarang, gambar_buku, isbn)
    `)
    .eq('qr_token', qrToken) as { data: TransaksiBaris[] | null, error: any }

  if (error) return { success: false, message: error.message }
  if (!data || data.length === 0) return { success: false, message: 'QR Code tidak valid.' }
  
  const firstItem = data[0]
  
  return { 
    success: true, 
    data: {
      qr_token: qrToken,
      anggota: firstItem.anggota,
      status_transaksi: firstItem.status_transaksi,
      items: data.map(item => ({
        id_transaksi: item.id_transaksi,
        ...(item.buku as object)
      }))
    } 
  }
}

export async function approveBorrowServer(qrToken: string) {
  try {
    const supabase = createAdminClient()
    const tglPinjam = new Date()
    const tglKembali = new Date()
    tglKembali.setDate(tglPinjam.getDate() + 7)

    const { error } = await supabase
      .from('transaksi')
      .update({
        status_transaksi: 'dipinjam',
        tgl_pinjam: tglPinjam.toISOString(),
        tgl_kembali_rencana: tglKembali.toISOString(),
      } as any) // Gunakan 'as any' untuk bypass strict mode jika skema belum sinkron
      .eq('qr_token', qrToken)

    if (error) return { success: false, message: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function processReturnServer(qrToken: string) {
  try {
    const supabase = createAdminClient()
    
    // Casting untuk view v_transaksi_aktif
    const { data: transactions, error: findError } = await supabase
      .from('v_transaksi_aktif')
      .select('id_transaksi, denda_realtime')
      .eq('qr_token', qrToken) as { data: any[] | null, error: any }

    if (findError) return { success: false, message: findError.message }
    if (!transactions || transactions.length === 0) return { success: false, message: 'Data tidak ditemukan.' }

    for (const trx of transactions) {
      await supabase
        .from('transaksi')
        .update({
          status_transaksi: 'dikembalikan',
          tgl_kembali_aktual: new Date().toISOString(),
          denda: trx.denda_realtime,
        } as any)
        .eq('id_transaksi', trx.id_transaksi)
    }
    
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}