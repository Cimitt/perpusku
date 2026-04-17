import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST /api/feeds/[feedId]/comments — tambah komentar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feedId } = await params
    const body = await request.json()
    const commentText = body.comment_text?.trim()

    if (!commentText) {
      return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Ambil id_anggota
    const { data: pengguna } = await supabase
      .from('pengguna')
      .select('id_pengguna')
      .eq('clerk_id', userId)
      .single()

    if (!pengguna) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    const { data: anggota } = await supabase
      .from('anggota')
      .select('id_anggota')
      .eq('id_pengguna', pengguna.id_pengguna)
      .single()

    if (!anggota) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    // Insert komentar
    const { data: comment, error: insertErr } = await supabase
      .from('feed_comments')
      .insert({
        id_feed: feedId,
        id_anggota: anggota.id_anggota,
        comment_text: commentText,
      })
      .select(`
        id_comment,
        comment_text,
        created_at,
        anggota (
          nama_anggota,
          username,
          avatar_url
        )
      `)
      .single()

    if (insertErr) {
      console.error('[API_COMMENT_POST] Insert error:', insertErr)
      return NextResponse.json({ error: 'Gagal menyimpan komentar' }, { status: 500 })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    console.error('[API_COMMENT_POST] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET /api/feeds/[feedId]/comments — ambil semua komentar feed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feedId } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('feed_comments')
      .select(`
        id_comment,
        comment_text,
        created_at,
        anggota (
          nama_anggota,
          username,
          avatar_url
        )
      `)
      .eq('id_feed', feedId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Gagal memuat komentar' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API_COMMENT_GET] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
