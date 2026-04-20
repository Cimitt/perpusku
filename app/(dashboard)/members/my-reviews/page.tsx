'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  HeartIcon,
  MessageSquareIcon,
  TrashIcon,
  ImagePlusIcon,
  Loader2Icon,
  VideoIcon,
  ImageIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import type { FeedWithRelasi } from '@/types'

type MyFeed = Pick<FeedWithRelasi, 'id_feed' | 'caption' | 'media_url' | 'media_type' | 'likes_count' | 'created_at' | 'buku'>

export default function MyFeedsPage() {
  const { user, isLoaded } = useUser()
  
  const [feeds, setFeeds] = useState<MyFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<MyFeed | null>(null)
  const [deleting, setDeleting] = useState(false)

  // fetch data (khusus feed milik user)
  const fetchMyFeeds = useCallback(async () => {
    if (!isLoaded || !user) return
    setLoading(true)
    
    try {
      // Kita tambahkan query parameter ?my_feeds=true agar backend tahu ini khusus data milik user
      const res = await fetch('/api/feeds?my_feeds=true')
      
      if (!res.ok) throw new Error('Gagal mengambil data dari server')
      
      const data = await res.json()
      setFeeds(data ?? [])
    } catch {
      toast.error('Gagal memuat postingan kamu.')
    } finally {
      setLoading(false)
    }
  }, [isLoaded, user])

  useEffect(() => { 
    fetchMyFeeds() 
  }, [fetchMyFeeds])

  // delete data feed
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    
    try {
      // Panggil endpoint DELETE dengan ID Feed
      const res = await fetch(`/api/feeds/${deleteTarget.id_feed}`, { 
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Gagal menghapus postingan')
      
      toast.success('Postingan berhasil dihapus')
      setDeleteTarget(null)
      fetchMyFeeds() // Refresh list setelah delete
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className='max-w-3xl space-y-6 animate-in fade-in duration-500'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Postingan Saya</h1>
        <p className='text-sm text-muted-foreground'>
          Semua review dan feed komunitas yang pernah kamu bagikan.
        </p>
      </div>

      {/* --- KONDISI LOADING & EMPTY STATE --- */}
      {loading ? (
        <div className='flex justify-center py-16'>
          <Loader2Icon className='size-8 animate-spin text-primary/50' />
        </div>
      ) : feeds.length === 0 ? (
        <div className='rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400'>
          <ImagePlusIcon className='mx-auto mb-3 size-10 text-slate-200' />
          <p className='font-semibold text-sm'>Belum ada postingan</p>
          <p className='text-xs mt-1'>Bagikan momen atau ulasan bukumu di halaman Komunitas.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* --- LIST FEEDS --- */}
          {feeds.map(feed => (
            <Card key={feed.id_feed} className='border-none shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-4 sm:p-5'>
                <div className='flex items-start gap-4'>
                  
                  {/* Thumbnail Media */}
                  <div className='relative size-20 sm:size-24 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center'>
                    {feed.media_type === 'image' ? (
                      <img src={feed.media_url} alt='Feed media' className='w-full h-full object-cover' />
                    ) : (
                      <>
                        <video src={feed.media_url} className='w-full h-full object-cover opacity-80' />
                        <VideoIcon className='absolute size-6 text-white drop-shadow-md' />
                      </>
                    )}
                  </div>

                  {/* Info Konten */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <p className='text-xs text-slate-400 font-medium mb-1'>
                          {format(new Date(feed.created_at ?? Date.now()), 'dd MMM yyyy • HH:mm', { locale: id })}
                        </p>
                        {feed.buku?.judul_buku && (
                          <p className='text-[10px] font-bold tracking-wider text-primary uppercase line-clamp-1'>
                            {feed.buku.judul_buku}
                          </p>
                        )}
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='shrink-0 size-8 text-slate-400 hover:text-red-500 hover:bg-red-50 -mt-1 -mr-2'
                        onClick={() => setDeleteTarget(feed)}
                      >
                        <TrashIcon className='size-4' />
                      </Button>
                    </div>

                    <p className='mt-1 text-sm text-slate-700 leading-relaxed line-clamp-2'>
                      {feed.caption}
                    </p>

                    <div className='mt-3 flex items-center gap-4'>
                      <div className='flex items-center gap-1.5 text-slate-500'>
                        <HeartIcon className={`size-4 ${(feed.likes_count ?? 0) > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span className='text-xs font-semibold'>{feed.likes_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- MODAL KONFIRMASI DELETE --- */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Postingan?</DialogTitle>
            <DialogDescription>
              Postingan ini beserta semua komentar dan *likes*-nya akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
