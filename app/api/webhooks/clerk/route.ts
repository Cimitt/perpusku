// Clerk Webhook — sync user.created ke tabel pengguna + anggota di Supabase
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/admin'

// types
interface ClerkUserCreatedEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    username: string | null
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string
    public_metadata: { role?: string }
  }
}

export async function POST(req: NextRequest) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!CLERK_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret tidak dikonfigurasi' }, { status: 500 })
  }

  // Verifikasi signature Svix
  const svixId        = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()

  let event: ClerkUserCreatedEvent
  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET)
    event = wh.verify(body, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserCreatedEvent
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // user.created
  if (event.type === 'user.created') {
    const { id: clerkId, username, email_addresses, primary_email_address_id, first_name, last_name, image_url } = event.data

    const primaryEmail = email_addresses.find(e => e.id === primary_email_address_id)?.email_address
      ?? email_addresses[0]?.email_address
      ?? ''

    const namaLengkap = [first_name, last_name].filter(Boolean).join(' ') || username || 'Anggota'

    // 1. Insert ke tabel pengguna
    const { data: pengguna, error: penggunaError } = await supabase
      .from('pengguna')
      .insert({
        clerk_id:      clerkId,
        username:      username ?? null,
        email:         primaryEmail,
        nama_pengguna: namaLengkap,
        level:         'Anggota',
        is_active:     true,
      })
      .select('id_pengguna')
      .single()

    if (penggunaError) {
      console.error('Error inserting pengguna:', penggunaError)
      return NextResponse.json({ error: penggunaError.message }, { status: 500 })
    }

    // 2. Insert ke tabel anggota (profil detail)
    const { error: anggotaError } = await supabase
      .from('anggota')
      .insert({
        id_pengguna:  pengguna.id_pengguna,
        nama_anggota: namaLengkap,
        email:        primaryEmail,
        nis:          null,
        kelas:        null,
        foto:         image_url || null,
        avatar_url:   image_url || null,
        username:     username ?? null,
        clerk_id:     clerkId,
      })

    if (anggotaError) {
      console.error('Error inserting anggota:', anggotaError)
      return NextResponse.json({ error: anggotaError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'User synced to Supabase' })
  }

  // user.updated
  if (event.type === 'user.updated') {
    const { id: clerkId, email_addresses, primary_email_address_id, first_name, last_name, username, image_url } = event.data

    const primaryEmail = email_addresses.find(e => e.id === primary_email_address_id)?.email_address
      ?? email_addresses[0]?.email_address

    const namaLengkap = [first_name, last_name].filter(Boolean).join(' ') || username

    await supabase
      .from('pengguna')
      .update({
        ...(primaryEmail && { email: primaryEmail }),
        ...(namaLengkap && { nama_pengguna: namaLengkap }),
        ...(username && { username }),
      })
      .eq('clerk_id', clerkId)

    await supabase
      .from('anggota')
      .update({
        ...(primaryEmail && { email: primaryEmail }),
        ...(namaLengkap && { nama_anggota: namaLengkap }),
        ...(username && { username }),
        ...(image_url && { foto: image_url }),
      })
      .eq('clerk_id', clerkId)

    return NextResponse.json({ success: true, message: 'User updated' })
  }

  // user.deleted
  if (event.type === 'user.deleted') {
    const { id: clerkId } = event.data

    await supabase
      .from('pengguna')
      .update({ is_active: false })
      .eq('clerk_id', clerkId)

    return NextResponse.json({ success: true, message: 'User deactivated' })
  }

  return NextResponse.json({ received: true })
}
