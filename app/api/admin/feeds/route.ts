import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims as any)?.metadata?.role
  if (role !== 'Admin' && role !== 'Petugas') return null
  return userId
}

// GET /api/admin/feeds — ambil semua feeds untuk monitoring
export async function GET(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''

  let query = supabase
    .from('feeds')
    .select(`
      id_feed,
      caption,
      media_url,
      media_type,
      rating,
      likes_count,
      created_at,
      anggota (
        id_anggota,
        nama_anggota,
        username,
        avatar_url
      ),
      buku (
        judul_buku
      ),
      feed_comments (
        id_comment,
        comment_text,
        created_at,
        anggota (
          nama_anggota,
          username
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (search.trim()) {
    query = query.or(`caption.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[ADMIN_FEEDS_GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// DELETE /api/admin/feeds?id=xxx — hapus feed
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const feedId = searchParams.get('id')
  const commentId = searchParams.get('comment_id')

  const supabase = createAdminClient()

  // Hapus komentar spesifik
  if (commentId) {
    const { error } = await supabase
      .from('feed_comments')
      .delete()
      .eq('id_comment', commentId)

    if (error) {
      console.error('[ADMIN_FEEDS_DELETE_COMMENT]', error)
      return NextResponse.json({ error: 'Gagal menghapus komentar' }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: 'Komentar berhasil dihapus' })
  }

  // Hapus feed beserta semua dependensinya
  if (feedId) {
    // 1. Hapus semua komentar di feed ini
    await supabase.from('feed_comments').delete().eq('id_feed', feedId)
    // 2. Hapus semua likes di feed ini
    await supabase.from('feed_likes').delete().eq('id_feed', feedId)
    // 3. Hapus feed-nya
    const { error } = await supabase.from('feeds').delete().eq('id_feed', feedId)

    if (error) {
      console.error('[ADMIN_FEEDS_DELETE]', error)
      return NextResponse.json({ error: 'Gagal menghapus feed' }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: 'Feed berhasil dihapus' })
  }

  return NextResponse.json({ error: 'Parameter id atau comment_id diperlukan' }, { status: 400 })
}
