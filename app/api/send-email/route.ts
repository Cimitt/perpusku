import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';
import { escapeHtml } from '@/lib/security';
import { z } from 'zod';

// Input validation schema
const EmailPayloadSchema = z.object({
  email: z.string().email('Email tidak valid'),
  nama: z.string().min(1).max(100),
  buku: z.string().min(1).max(200),
  denda: z.number().min(0),
  hari: z.number().int().min(0),
  nis: z.string().max(30),
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

    const { email, nama, buku, denda, hari, nis } = parsed.data;

    // [FIX #3] HTML-escape all user-supplied values before template interpolation
    const safeNama = escapeHtml(nama);
    const safeBuku = escapeHtml(buku);
    const safeNis = escapeHtml(nis);
    const safeDenda = Number(denda); // already validated by Zod
    const safeHari = Number(hari);

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
      subject: `🚨 PEMBERITAHUAN DENDA: ${safeBuku.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Nota Tagihan Denda</h2>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <p>Halo <strong>${safeNama}</strong> (${safeNis}),</p>
            <p>Kami menginformasikan bahwa peminjaman buku berikut telah melewati batas waktu pengembalian:</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px;">
                <tr><td style="color: #64748b; width: 120px;">Buku:</td><td><strong>${safeBuku}</strong></td></tr>
                <tr><td style="color: #64748b;">Keterlambatan:</td><td style="color: #dc2626;"><strong>${safeHari} Hari</strong></td></tr>
                <tr><td style="color: #64748b;">Total Denda:</td><td style="font-size: 18px; color: #b45309;"><strong>Rp ${safeDenda.toLocaleString('id-ID')}</strong></td></tr>
              </table>
            </div>

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