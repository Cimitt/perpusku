'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SearchIcon,
  Trash2Icon,
  MessageCircleIcon,
  HeartIcon,
  StarIcon,
  AlertCircleIcon,
  RssIcon,
  Loader2Icon,
  SendIcon,
  BookmarkIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { FeedEmpty, FeedLoading } from '@/components/member/feeds'
import { formatTimeAgo } from '@/components/member/feeds/feed.utils'

interface FeedItem {
  id_feed: string
  caption: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  rating: number | null
  likes_count: number | null
  created_at: string | null
  anggota: {
    id_anggota: number
    nama_anggota: string
    username: string | null
    avatar_url: string | null
  } | null
  buku: {
    judul_buku: string
  } | null
  feed_comments: CommentItem[]
}

interface CommentItem {
  id_comment: string
  comment_text: string
  created_at: string | null
  anggota: {
    nama_anggota: string
    username: string | null
  } | null
}

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'feed' | 'comment'
    id: string
    label: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchFeeds = useCallback(async () => {
    try {
      setLoading(true)
      const params = search.trim() ? `?q=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/feeds${params}`)
      if (!res.ok) throw new Error('Gagal memuat feeds')
      const json = await res.json()
      setFeeds(json.data ?? [])
    } catch {
      toast.error('Gagal memuat data feeds')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchFeeds, 400)
    return () => clearTimeout(timer)
  }, [fetchFeeds])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const param =
        deleteTarget.type === 'feed'
          ? `id=${deleteTarget.id}`
          : `comment_id=${deleteTarget.id}`
      const res = await fetch(`/api/admin/feeds?${param}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')

      if (deleteTarget.type === 'feed') {
        setFeeds((prev) => prev.filter((f) => f.id_feed !== deleteTarget.id))
        toast.success('Feed berhasil dihapus')
      } else {
        setFeeds((prev) =>
          prev.map((f) => ({
            ...f,
            feed_comments: f.feed_comments.filter(
              (c) => c.id_comment !== deleteTarget.id
            ),
          }))
        )
        toast.success('Komentar berhasil dihapus')
      }
    } catch {
      toast.error('Gagal menghapus data')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="space-y-4 px-2 pt-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Community Reviews</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Kelola postingan dan komentar komunitas.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari caption..."
            className="h-10 w-full rounded-lg border-2 border-muted bg-white py-2.5 pl-10 pr-4 text-sm font-bold outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2">
            <Badge variant="outline" className="justify-center gap-1.5 border-secondary text-secondary font-black">
              <RssIcon className="size-3" /> {feeds.length}
            </Badge>
            <Badge variant="outline" className="justify-center gap-1.5 border-secondary text-secondary font-black">
              <MessageCircleIcon className="size-3" />{' '}
              {feeds.reduce((sum, f) => sum + (f.feed_comments?.length || 0), 0)}
            </Badge>
            <Badge variant="outline" className="justify-center gap-1.5 border-secondary text-secondary font-black">
              <HeartIcon className="size-3" />{' '}
              {feeds.reduce((sum, f) => sum + (f.likes_count || 0), 0)}
            </Badge>
          </div>
        )}
      </div>

      {/* Feed List */}
      <div className="space-y-8">
        {loading ? (
          <FeedLoading />
        ) : feeds.length === 0 ? (
          <FeedEmpty />
        ) : (
          feeds.map((feed) => {
            const isExpanded = expandedFeed === feed.id_feed
            const anggota = Array.isArray(feed.anggota)
              ? (feed.anggota as any)[0]
              : feed.anggota
            const comments = feed.feed_comments || []

            return (
              <Card key={feed.id_feed} className="border-2 border-muted bg-white overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-center p-3 sm:p-4 border-b-2 border-muted/50 space-y-0">
                  <Avatar className="size-10 border-2 border-muted bg-muted/30 mr-3">
                    <AvatarImage src={anggota?.avatar_url ?? undefined} />
                    <AvatarFallback className="font-bold text-primary">
                      {(anggota?.username || anggota?.nama_anggota || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {anggota?.username || anggota?.nama_anggota || 'Anonim'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 border-secondary text-secondary font-black tracking-wider rounded-md"
                      >
                        {feed.buku?.judul_buku || 'Post Umum'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-red-50 hover:text-red-500"
                    onClick={() =>
                      setDeleteTarget({
                        type: 'feed',
                        id: feed.id_feed,
                        label: `Feed oleh "${anggota?.nama_anggota || 'Anonim'}"`,
                      })
                    }
                  >
                    <Trash2Icon className="size-5" />
                  </Button>
                </CardHeader>

                <div className="relative w-full aspect-[4/5] bg-muted/20 border-b-2 border-muted/50 overflow-hidden flex items-center justify-center">
                  {feed.media_type === 'video' ? (
                    <video
                      src={feed.media_url ?? undefined}
                      controls
                      muted
                      loop
                      playsInline
                      className="object-contain w-full h-full bg-black/5"
                    />
                  ) : (
                    <img
                      src={feed.media_url ?? undefined}
                      alt="Review Media"
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>

                <CardContent className="p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <HeartIcon className="size-7 text-foreground" />
                      <button
                        onClick={() => setExpandedFeed(isExpanded ? null : feed.id_feed)}
                        className="hover:scale-110 active:scale-90 transition-transform"
                      >
                        <MessageCircleIcon className="size-7 text-foreground" />
                      </button>
                      <SendIcon className="size-6 text-foreground -mt-1" />
                    </div>
                    <BookmarkIcon className="size-6 text-foreground" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-foreground">
                      {(feed.likes_count ?? 0).toLocaleString()} suka
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`size-3.5 ${
                            i < (feed.rating || 5) ? 'fill-secondary text-secondary' : 'fill-muted text-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {feed.caption && (
                    <div className="text-sm">
                      <span className="font-bold text-foreground mr-2">
                        {anggota?.username || anggota?.nama_anggota?.split(' ')[0] || 'Member'}
                      </span>
                      <span className="font-medium text-slate-600 leading-relaxed">{feed.caption}</span>
                    </div>
                  )}

                  {comments.length > 0 && (
                    <div className="space-y-1">
                      <p
                        onClick={() => setExpandedFeed(isExpanded ? null : feed.id_feed)}
                        className="text-xs font-bold text-muted-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
                      >
                        {isExpanded ? 'Sembunyikan komentar' : `Lihat semua ${comments.length} komentar`}
                      </p>
                      {(isExpanded ? comments : comments.slice(0, 2)).map((comment) => {
                        const cAnggota = Array.isArray(comment.anggota) ? (comment.anggota as any)[0] : comment.anggota
                        return (
                          <div key={comment.id_comment} className="group flex gap-2 text-sm">
                            <span className="font-bold text-foreground shrink-0">
                              {cAnggota?.username || cAnggota?.nama_anggota || 'Member'}
                            </span>
                            <span className="font-medium text-slate-600 line-clamp-1 flex-1">
                              {comment.comment_text}
                            </span>
                            {isExpanded && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0 text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'comment',
                                    id: comment.id_comment,
                                    label: `Komentar oleh "${cAnggota?.nama_anggota || 'Member'}"`,
                                  })
                                }
                              >
                                <Trash2Icon className="size-3" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
                    {formatTimeAgo(feed.created_at)}
                  </p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircleIcon className="size-5 text-red-500" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah kamu yakin ingin menghapus{' '}
              <span className="font-bold text-foreground">{deleteTarget?.label}</span>?{' '}
              {deleteTarget?.type === 'feed' && 'Semua komentar dan likes pada feed ini juga akan ikut terhapus.'}
              <br />
              <span className="text-red-500 font-medium">Tindakan ini tidak bisa dibatalkan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600">
              {deleting ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <Trash2Icon className="size-4 mr-2" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
