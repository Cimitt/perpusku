import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const WhatsAppPayloadSchema = z.object({
  id_transaksi: z.number().int().positive(),
})

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

function normalizeWhatsAppNumber(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

function getMetadataPhone(metadata: Record<string, unknown>) {
  const keys = ['phone', 'phone_number', 'nomor_hp', 'no_hp', 'whatsapp', 'wa']
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

export async function POST(request: Request) {
  try {
    const userId = await requireAdmin()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = WhatsAppPayloadSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'id_transaksi tidak valid' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('transaksi')
      .select('id_transaksi, anggota!inner(nomor_hp, pengguna!inner(clerk_id))')
      .eq('id_transaksi', parsed.data.id_transaksi)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    const anggota = Array.isArray((data as any).anggota) ? (data as any).anggota[0] : (data as any).anggota
    const anggotaPhone = typeof anggota?.nomor_hp === 'string' ? anggota.nomor_hp : null
    const anggotaWhatsappNumber = anggotaPhone ? normalizeWhatsAppNumber(anggotaPhone) : null
    if (anggotaWhatsappNumber) {
      return NextResponse.json({ success: true, phone: anggotaWhatsappNumber })
    }

    const pengguna = Array.isArray(anggota?.pengguna) ? anggota.pengguna[0] : anggota?.pengguna
    const clerkId = pengguna?.clerk_id

    if (!clerkId) {
      return NextResponse.json({ error: 'Akun anggota tidak terhubung ke Clerk' }, { status: 404 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(clerkId)
    const primaryPhone = user.phoneNumbers.find((phone) => phone.id === user.primaryPhoneNumberId)?.phoneNumber
    const fallbackPhone = user.phoneNumbers[0]?.phoneNumber
    const metadataPhone =
      getMetadataPhone(user.publicMetadata as Record<string, unknown>) ??
      getMetadataPhone(user.privateMetadata as Record<string, unknown>) ??
      getMetadataPhone(user.unsafeMetadata as Record<string, unknown>)
    const phoneNumber = primaryPhone ?? fallbackPhone ?? metadataPhone
    const whatsappNumber = phoneNumber ? normalizeWhatsAppNumber(phoneNumber) : null

    if (!whatsappNumber) {
      return NextResponse.json({ error: 'Nomor HP anggota belum tersedia.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, phone: whatsappNumber })
  } catch (error) {
    console.error('WhatsApp bill error:', error)
    return NextResponse.json({ error: 'Gagal menyiapkan tagihan WhatsApp' }, { status: 500 })
  }
}
