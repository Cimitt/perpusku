'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SearchIcon,
  Trash2Icon,
  MessageCircleIcon,
  HeartIcon,
  StarIcon,
  ImageIcon,
  VideoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertCircleIcon,
  RssIcon,
  Loader2Icon,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitoring Feeds</h1>
        <p className="text-muted-foreground text-sm">
          Kelola dan moderasi postingan & komentar komunitas.
        </p>
      </div>

      {/* Search */}
      <div className="relative md:w-1/2">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari caption..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      {/* Stats */}
      {!loading && (
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-bold">
            <RssIcon className="size-3" /> {feeds.length} Feed
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-bold">
            <MessageCircleIcon className="size-3" />{' '}
            {feeds.reduce((sum, f) => sum + (f.feed_comments?.length || 0), 0)} Komentar
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-bold">
            <HeartIcon className="size-3" />{' '}
            {feeds.reduce((sum, f) => sum + (f.likes_count || 0), 0)} Like
          </Badge>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : feeds.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-16 text-center">
              <RssIcon className="size-12 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-muted-foreground">
                Belum ada feed yang ditemukan.
              </p>
            </CardContent>
          </Card>
        ) : (
          feeds.map((feed) => {
            const isExpanded = expandedFeed === feed.id_feed
            const anggota = Array.isArray(feed.anggota)
              ? (feed.anggota as any)[0]
              : feed.anggota
            const comments = feed.feed_comments || []

            return (
              <Card key={feed.id_feed} className="border-none shadow-sm overflow-hidden">
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 border-2 border-slate-100">
                      <AvatarImage src={anggota?.avatar_url ?? undefined} />
                      <AvatarFallback className="font-bold text-primary bg-primary/10">
                        {(anggota?.username || anggota?.nama_anggota || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 truncate">
                          {anggota?.username || anggota?.nama_anggota || 'Anonim'}
                        </span>
                        {feed.buku && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-200 text-blue-600 font-bold">
                            {feed.buku.judul_buku}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {formatDate(feed.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {feed.media_type === 'video' ? (
                        <Badge variant="outline" className="gap-1 text-[10px] border-purple-200 text-purple-600">
                          <VideoIcon className="size-3" /> Video
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-[10px] border-emerald-200 text-emerald-600">
                          <ImageIcon className="size-3" /> Gambar
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'feed',
                            id: feed.id_feed,
                            label: `Feed oleh "${anggota?.nama_anggota || 'Anonim'}"`,
                          })
                        }
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {feed.caption && (
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border">
                      {feed.caption}
                    </p>
                  )}

                  {feed.media_url && feed.media_type === 'image' && (
                    <div className="w-full max-h-48 rounded-xl overflow-hidden border bg-slate-50">
                      <img src={feed.media_url} alt="Feed media" className="w-full h-full object-cover max-h-48" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <HeartIcon className="size-3.5 text-red-400" />
                      <span className="font-bold">{feed.likes_count ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircleIcon className="size-3.5 text-blue-400" />
                      <span className="font-bold">{comments.length}</span>
                    </div>
                    {feed.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`size-3 ${i < feed.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {comments.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpandedFeed(isExpanded ? null : feed.id_feed)}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        {isExpanded ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
                        {isExpanded ? 'Sembunyikan komentar' : `Lihat ${comments.length} komentar`}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                          {comments.map((comment) => {
                            const cAnggota = Array.isArray(comment.anggota) ? (comment.anggota as any)[0] : comment.anggota
                            return (
                              <div key={comment.id_comment} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border group">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">
                                      {cAnggota?.username || cAnggota?.nama_anggota || 'Member'}
                                    </span>
                                    <span className="text-[9px] text-slate-300">{formatDate(comment.created_at)}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{comment.comment_text}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
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
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
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