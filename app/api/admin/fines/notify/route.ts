import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import nodemailer from 'nodemailer'

// Gunakan fungsi pengaman yang sama persis dengan milikmu
async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAdmin()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { email, nama_anggota, denda_belum_bayar } = body

    // Cek apakah member punya email
    if (!email || email.trim() === '') {
      return NextResponse.json({ error: 'Anggota ini tidak memiliki alamat email di sistem.' }, { status: 400 })
    }

    // Konfigurasi SMTP Nodemailer menggunakan Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Desain Email HTML
    const mailOptions = {
      from: `"PerpuSmuhda" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Tagihan Denda Keterlambatan Perpustakaan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #ef4444; color: white; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 1px;">Pemberitahuan Tagihan Denda</h2>
          </div>
          <div style="padding: 32px; color: #334155; background-color: #ffffff;">
            <p style="font-size: 16px;">Halo, <strong>${nama_anggota}</strong>,</p>
            <p style="line-height: 1.6;">Kami dari <strong>PerpuSmuhda</strong> ingin menginformasikan bahwa Anda memiliki denda keterlambatan pengembalian buku yang belum diselesaikan.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 13px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Total Denda Belum Dibayar:</p>
              <h1 style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 32px;">Rp ${denda_belum_bayar.toLocaleString('id-ID')}</h1>
            </div>

            <p style="line-height: 1.6;">Mohon segera menyelesaikan administrasi denda ini di meja petugas perpustakaan pada jam operasional kerja untuk memulihkan status peminjaman Anda.</p>
            <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 32px 0 24px 0;" />
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">Abaikan pesan ini jika Anda merasa sudah menyelesaikan pembayaran.</p>
          </div>
        </div>
      `,
    }

    // Eksekusi pengiriman email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true, message: 'Email tagihan berhasil dikirim!' })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json({ error: 'Gagal mengirim email. Periksa pengaturan akun pengirim.' }, { status: 500 })
  }
}