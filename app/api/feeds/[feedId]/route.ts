import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getCurrentAnggotaId(clerkId: string) {
  const supabase = createAdminClient()

  const { data: pengguna, error: penggunaError } = await supabase
    .from('pengguna')
    .select('id_pengguna')
    .eq('clerk_id', clerkId)
    .single()

  if (penggunaError || !pengguna) return null

  const { data: anggota, error: anggotaError } = await supabase
    .from('anggota')
    .select('id_anggota')
    .eq('id_pengguna', pengguna.id_pengguna)
    .single()

  if (anggotaError || !anggota) return null
  return anggota.id_anggota
}

function getStoragePathFromPublicUrl(mediaUrl: string | null) {
  if (!mediaUrl) return null

  try {
    const url = new URL(mediaUrl)
    const marker = '/storage/v1/object/public/feed_media/'
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) return null
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feedId } = await params
    const { caption } = await request.json()

    if (typeof caption !== 'string' || !caption.trim()) {
      return NextResponse.json({ error: 'Caption wajib diisi' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const idAnggota = await getCurrentAnggotaId(userId)

    if (!idAnggota) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    const { data: existingFeed, error: feedError } = await supabase
      .from('feeds')
      .select('id_feed, id_anggota')
      .eq('id_feed', feedId)
      .single()

    if (feedError || !existingFeed) {
      return NextResponse.json({ error: 'Feed tidak ditemukan' }, { status: 404 })
    }

    if (existingFeed.id_anggota !== idAnggota) {
      return NextResponse.json({ error: 'Tidak diizinkan mengubah feed ini' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('feeds')
      .update({ caption: caption.trim() })
      .eq('id_feed', feedId)
      .eq('id_anggota', idAnggota)
      .select('id_feed, caption')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Gagal memperbarui feed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API_FEED_PATCH] Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feedId } = await params
    const supabase = createAdminClient()
    const idAnggota = await getCurrentAnggotaId(userId)

    if (!idAnggota) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    const { data: existingFeed, error: feedError } = await supabase
      .from('feeds')
      .select('id_feed, id_anggota, media_url')
      .eq('id_feed', feedId)
      .single()

    if (feedError || !existingFeed) {
      return NextResponse.json({ error: 'Feed tidak ditemukan' }, { status: 404 })
    }

    if (existingFeed.id_anggota !== idAnggota) {
      return NextResponse.json({ error: 'Tidak diizinkan menghapus feed ini' }, { status: 403 })
    }

    await supabase.from('feed_comments').delete().eq('id_feed', feedId)
    await supabase.from('feed_likes').delete().eq('id_feed', feedId)

    const { error: deleteError } = await supabase
      .from('feeds')
      .delete()
      .eq('id_feed', feedId)
      .eq('id_anggota', idAnggota)

    if (deleteError) {
      return NextResponse.json({ error: 'Gagal menghapus feed' }, { status: 500 })
    }

    const storagePath = getStoragePathFromPublicUrl(existingFeed.media_url)
    if (storagePath) {
      await supabase.storage.from('feed_media').remove([storagePath])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API_FEED_DELETE] Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
