import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
const MAX_MEDIA_SIZE = 10 * 1024 * 1024 // 10 MB

export const dynamic = 'force-dynamic'

// get
export async function GET(request: Request) {
  try {
    // [FIX #7] Require authentication for all feed access to prevent PII leakage
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Cek apakah ada query parameter ?my_feeds=true dari frontend
    const { searchParams } = new URL(request.url)
    const isMyFeeds = searchParams.get('my_feeds') === 'true'

    // Siapkan query dasar
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
            username,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Ambil id_anggota user yang sedang login untuk cek like status
    let currentIdAnggota: number | null = null
    const { data: pengguna } = await supabase.from('pengguna').select('id_pengguna').eq('clerk_id', userId).single()
    if (pengguna) {
      const { data: anggota } = await supabase.from('anggota').select('id_anggota').eq('id_pengguna', pengguna.id_pengguna).single()
      if (anggota) currentIdAnggota = anggota.id_anggota
    }

    // JIKA dipanggil dari halaman "Postingan Saya", saring berdasarkan user login
    if (isMyFeeds) {
      if (currentIdAnggota) {
        query = query.eq('id_anggota', currentIdAnggota)
      } else {
        return NextResponse.json([])
      }
    }

    // Eksekusi query
    const { data: feeds, error } = await query

    if (error) {
      console.error("[API_FEEDS_GET] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ambil semua feed_likes user ini untuk menentukan is_liked
    let likedFeedIds = new Set<string>()
    if (currentIdAnggota) {
      const { data: likes } = await supabase
        .from('feed_likes')
        .select('id_feed')
        .eq('id_anggota', currentIdAnggota)
      if (likes) {
        likedFeedIds = new Set(likes.map((l: any) => l.id_feed))
      }
    }

    const formattedFeeds = feeds.map((f: any) => ({
      ...f,
      is_liked: likedFeedIds.has(f.id_feed),
    }))

    return NextResponse.json(formattedFeeds)
  } catch (err: any) {
    console.error('[API_FEEDS_GET] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// post
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // search id_pengguna in pengguna table based on clerk_id
    const { data: pengguna, error: errPengguna } = await supabase
      .from('pengguna')
      .select('id_pengguna')
      .eq('clerk_id', userId)
      .single()

    if (errPengguna || !pengguna) {
      return NextResponse.json({ error: "Akun pengguna tidak ditemukan di database." }, { status: 404 })
    }

    // search id_anggota in anggota table based on id_pengguna
    const { data: anggota, error: errAnggota } = await supabase
      .from('anggota')
      .select('id_anggota')
      .eq('id_pengguna', pengguna.id_pengguna)
      .single()

    if (errAnggota || !anggota) {
      return NextResponse.json({ error: "Profil anggota tidak ditemukan." }, { status: 404 })
    }

    const formData = await request.formData()
    const caption = formData.get('caption') as string
    const media = formData.get('media') as File

    if (!caption || !media) {
      return NextResponse.json({ error: "Caption dan media wajib diisi" }, { status: 400 })
    }

    // [FIX #6] Validate file type and size before processing
    if (!ALLOWED_MEDIA_TYPES.includes(media.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak diizinkan. Gunakan: ${ALLOWED_MEDIA_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
    if (media.size > MAX_MEDIA_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 10 MB' },
        { status: 400 }
      )
    }

    const bytes = await media.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueFileName = `${Date.now()}-${media.name.replace(/\s+/g, '_')}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('feed_media') 
      .upload(uniqueFileName, buffer, {
        contentType: media.type,
        upsert: false
      })

    if (uploadError) {
      console.error("[UPLOAD_ERROR]", uploadError)
      return NextResponse.json({ error: "Gagal mengunggah media" }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('feed_media')
      .getPublicUrl(uploadData.path)

    const mediaUrl = publicUrlData.publicUrl
    const mediaType = media.type.startsWith('video') ? 'video' : 'image'

    // Gunakan id_anggota yang didapat dari Tahap 2
    const { data: newFeed, error: insertError } = await supabase
      .from('feeds')
      .insert({
        caption: caption,
        media_url: mediaUrl,
        media_type: mediaType,
        id_anggota: anggota.id_anggota,
        rating: 5,
        likes_count: 0
      })
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
          email,
          foto
        )
      `)
      .single()

    if (insertError) {
      console.error("[DB_INSERT_ERROR]", insertError)
      return NextResponse.json({ error: "Gagal menyimpan data ke database" }, { status: 500 })
    }

    return NextResponse.json(newFeed, { status: 201 })

  } catch (error: any) {
    console.error("[API_FEEDS_POST] Internal Error:", error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}