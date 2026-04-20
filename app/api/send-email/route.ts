import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';
import { escapeHtml } from '@/lib/security';
import { z } from 'zod';

const FineBookSchema = z.object({
  judul_buku: z.string().min(1).max(200),
  tgl_kembali_rencana: z.string().min(1).max(60),
  hari_keterlambatan: z.number().int().min(0),
  denda_realtime: z.number().min(0),
});

// Input validation schema
const EmailPayloadSchema = z.object({
  email: z.string().email('Email tidak valid'),
  nama: z.string().min(1).max(100),
  buku: z.string().min(1).max(200),
  denda: z.number().min(0),
  hari: z.number().int().min(0),
  nis: z.string().max(30),
  kelas: z.string().max(50).nullable().optional(),
  qr_token: z.string().max(255).nullable().optional(),
  books: z.array(FineBookSchema).min(1).max(50).optional(),
});

// Auth guard — only Admin & Petugas can send fine notifications
async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)
    ?.metadata?.role;
  if (role !== 'Admin' && role !== 'Petugas') return null;
  return userId;
}

export async function POST(request: Request) {
  try {
    // [FIX #2] Authentication + authorization check
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // [FIX #3] Validate and sanitize input
    const parsed = EmailPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, nama, buku, denda, hari, nis, kelas, qr_token, books } = parsed.data;

    // [FIX #3] HTML-escape all user-supplied values before template interpolation
    const safeNama = escapeHtml(nama);
    const safeNis = escapeHtml(nis);
    const safeKelas = escapeHtml(kelas || '-');
    const safeQrToken = escapeHtml(qr_token || '-');
    const safeDenda = Number(denda); // already validated by Zod
    const safeHari = Number(hari);
    const safeBooks = (books?.length ? books : [{
      judul_buku: buku,
      tgl_kembali_rencana: '',
      hari_keterlambatan: hari,
      denda_realtime: denda,
    }]).map((item) => ({
      judul: escapeHtml(item.judul_buku),
      batasKembali: item.tgl_kembali_rencana
        ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(item.tgl_kembali_rencana))
        : '-',
      hari: Number(item.hari_keterlambatan),
      denda: Number(item.denda_realtime),
    }));
    const bookRows = safeBooks.map((item, index) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${index + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;"><strong>${item.judul}</strong></td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; color: #dc2626;"><strong>${item.hari} hari</strong></td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">${item.batasKembali}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #b45309;"><strong>Rp ${item.denda.toLocaleString('id-ID')}</strong></td>
      </tr>
    `).join('');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Perpustakaan SMK 2" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🚨 PEMBERITAHUAN DENDA: ${safeBooks.length} BUKU TERLAMBAT`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Nota Tagihan Denda</h2>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <p>Halo <strong>${safeNama}</strong> (${safeNis}),</p>
            <p>Kami menginformasikan bahwa peminjaman dalam satu QR berikut telah melewati batas waktu pengembalian:</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px;">
                <tr><td style="color: #64748b; width: 120px;">Kelas:</td><td><strong>${safeKelas}</strong></td></tr>
                <tr><td style="color: #64748b;">QR:</td><td><strong>${safeQrToken}</strong></td></tr>
                <tr><td style="color: #64748b;">Jumlah Buku:</td><td><strong>${safeBooks.length} buku</strong></td></tr>
                <tr><td style="color: #64748b;">Telat Terlama:</td><td style="color: #dc2626;"><strong>${safeHari} Hari</strong></td></tr>
                <tr><td style="color: #64748b;">Total Denda:</td><td style="font-size: 18px; color: #b45309;"><strong>Rp ${safeDenda.toLocaleString('id-ID')}</strong></td></tr>
              </table>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
              <thead>
                <tr style="background-color: #fee2e2; color: #991b1b;">
                  <th style="padding: 10px 8px; text-align: left;">No</th>
                  <th style="padding: 10px 8px; text-align: left;">Buku</th>
                  <th style="padding: 10px 8px; text-align: left;">Telat</th>
                  <th style="padding: 10px 8px; text-align: left;">Batas Kembali</th>
                  <th style="padding: 10px 8px; text-align: right;">Denda</th>
                </tr>
              </thead>
              <tbody>${bookRows}</tbody>
            </table>

            <p style="font-size: 13px; color: #64748b;">*Denda akan terus bertambah sebesar Rp 1.000 setiap harinya sampai buku dikembalikan.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Perpustakaan SMK 2 Klara</p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">Harap segera mengembalikan buku untuk menghindari sanksi lebih lanjut.</p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Email terkirim' });

  } catch (error: any) {
    console.error("Gagal kirim email:", error);
    // [FIX #8] Don't leak internal error details to client
    return NextResponse.json({ success: false, error: 'Gagal mengirim email' }, { status: 500 });
  }
}
