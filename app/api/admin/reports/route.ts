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

export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'transactions'
  const from = searchParams.get('from')
  const to   = searchParams.get('to')
  const search = searchParams.get('q') ?? ''

  if (type === 'transactions') {
    let query = supabase
      .from('v_transaksi_aktif')
      .select('*')
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', from)
    if (to)   query = query.lte('created_at', to + 'T23:59:59')
    if (search) {
      const safe = sanitizePostgrestValue(search)
      query = query.or(`nama_anggota.ilike.%${safe}%,nis.ilike.%${safe}%,judul_buku.ilike.%${safe}%`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (type === 'fines') {
    let query = supabase
      .from('v_denda_per_anggota')
      .select('*')
      .gt('total_denda', 0)
      .order('denda_belum_bayar', { ascending: false })

    if (search) {
      const safe = sanitizePostgrestValue(search)
      query = query.or(`nama_anggota.ilike.%${safe}%,nis.ilike.%${safe}%`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (type === 'books') {
    let query = supabase
      .from('v_katalog_buku')
      .select('*')
      .order('judul_buku', { ascending: true })

    if (search) {
      const safe = sanitizePostgrestValue(search)
      query = query.or(`judul_buku.ilike.%${safe}%,pengarang.ilike.%${safe}%,nama_kategori.ilike.%${safe}%`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Tipe laporan tidak valid' }, { status: 400 })
}
