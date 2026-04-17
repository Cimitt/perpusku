import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizePostgrestValue } from '@/lib/security'

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// GET /api/admin/fines — list semua denda per anggota
export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''
  const filterUnpaid = searchParams.get('unpaid') === 'true'

  let query = supabase
    .from('v_denda_per_anggota')
    .select('*')
    .order('denda_belum_bayar', { ascending: false })

  if (search) {
    const safe = sanitizePostgrestValue(search)
    query = query.or(`nama_anggota.ilike.%${safe}%,nis.ilike.%${safe}%`)
  }
  if (filterUnpaid) {
    query = query.gt('denda_belum_bayar', 0)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// PATCH /api/admin/fines — tandai denda sudah dibayar
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { id_transaksi: number }
  if (!body.id_transaksi) {
    return NextResponse.json({ error: 'id_transaksi diperlukan' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('transaksi')
    .update({ denda_dibayar: true })
    .eq('id_transaksi', body.id_transaksi)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
