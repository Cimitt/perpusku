import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { feedId } = await params
    const supabase = createAdminClient()

    // Ambil id_anggota berdasarkan clerk_id
    const { data: pengguna, error: errPengguna } = await supabase
      .from('pengguna')
      .select('id_pengguna')
      .eq('clerk_id', userId)
      .single()

    if (errPengguna || !pengguna) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 })
    }

    const { data: anggota, error: errAnggota } = await supabase
      .from('anggota')
      .select('id_anggota')
      .eq('id_pengguna', pengguna.id_pengguna)
      .single()

    if (errAnggota || !anggota) {
      return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 })
    }

    const idAnggota = anggota.id_anggota

    // Cek apakah user sudah me-like feed ini sebelumnya
    const { data: existingLike } = await supabase
      .from('feed_likes')
      .select('id_like')
      .eq('id_feed', feedId)
      .eq('id_anggota', idAnggota)
      .single()

    // Ambil jumlah like saat ini
    const { data: feed } = await supabase
      .from('feeds')
      .select('likes_count')
      .eq('id_feed', feedId)
      .single()
      
    const currentLikes = feed?.likes_count || 0

    if (existingLike) {
      // Unlike
      await supabase
        .from('feed_likes')
        .delete()
        .eq('id_like', existingLike.id_like)

      await supabase
        .from('feeds')
        .update({ likes_count: Math.max(0, currentLikes - 1) })
        .eq('id_feed', feedId)

      return NextResponse.json({ message: "Unliked", is_liked: false })
      
    } else {
      // Like
      await supabase
        .from('feed_likes')
        .insert({
          id_feed: feedId,
          id_anggota: idAnggota
        })

      await supabase
        .from('feeds')
        .update({ likes_count: currentLikes + 1 })
        .eq('id_feed', feedId)

      return NextResponse.json({ message: "Liked", is_liked: true })
    }

  } catch (error: any) {
    console.error("[API_LIKE_POST] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}