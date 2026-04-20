import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizePostgrestValue } from '@/lib/security'
import type { Database } from '@/types/supabase'

type PenggunaRow = Database['public']['Tables']['pengguna']['Row']

// auth guard
async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as { metadata?: { role?: string } } | undefined)
    ?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// get /api/admin/members?q=&status=
export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q      = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? 'all'

  const supabase = createAdminClient()

  const [{ count: total }, { count: activeCount }] = await Promise.all([
    supabase.from('pengguna').select('*', { count: 'exact', head: true }).eq('level', 'Anggota'),
    supabase.from('pengguna').select('*', { count: 'exact', head: true }).eq('level', 'Anggota').eq('is_active', true),
  ])

  let query = supabase
    .from('pengguna')
    .select('id_pengguna, email, nama_pengguna, is_active, created_at, anggota(id_anggota, nis, nama_anggota, kelas, foto)')
    .eq('level', 'Anggota')
    .order('created_at', { ascending: false })

  if (q.trim()) {
    const safe = sanitizePostgrestValue(q)
    query = query.or(`nama_pengguna.ilike.%${safe}%,email.ilike.%${safe}%`)
  }
  if (status !== 'all') {
    query = query.eq('is_active', status === 'true')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data || []).map((row: any) => ({
      ...row,
      anggota: Array.isArray(row.anggota) ? row.anggota[0] ?? null : row.anggota,
    })),
    total: total ?? 0,
    activeCount: activeCount ?? 0,
  })
}

// patch /api/admin/members?id=:id — ubah status atau reset password member
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

  const body = await req.json() as {
    action?: 'set_status' | 'reset_password'
    is_active?: boolean
    password?: string
  }

  const action = body.action ?? 'set_status'

  if (action === 'reset_password') {
    const password = body.password?.trim() ?? ''
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: member, error: memberError } = await supabase
      .from('pengguna')
      .select('id_pengguna, clerk_id')
      .eq('id_pengguna', id)
      .eq('level', 'Anggota')
      .single() as unknown as {
        data: Pick<PenggunaRow, 'id_pengguna' | 'clerk_id'> | null
        error: Error | null
      }

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })
    }

    try {
      const clerk = await clerkClient()
      await clerk.users.updateUser(member.clerk_id, {
        password,
        signOutOfOtherSessions: true,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal reset password di Clerk'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ data: { id_pengguna: member.id_pengguna } })
  }

  if (typeof body.is_active !== 'boolean') {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
  }

  const { data, error } = await createAdminClient()
    .from('pengguna')
    .update({ is_active: body.is_active })
    .eq('id_pengguna', id)
    .eq('level', 'Anggota')
    .select('id_pengguna, is_active')
    .maybeSingle() as unknown as {
      data: Pick<PenggunaRow, 'id_pengguna' | 'is_active'> | null
      error: Error | null
    }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })
  return NextResponse.json({ data })
}
