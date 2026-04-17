'use client'

import { useState, useEffect, useCallback } from 'react'
import { SearchIcon, StarIcon, TrashIcon, MessageSquareIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import type { UlasanWithRelasi } from '@/types'

function Stars({ n }: { n: number }) {
  return (
    <div className='flex gap-0.5'>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} className={`size-3.5 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews]           = useState<UlasanWithRelasi[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [deleteTarget, setDeleteTarget] = useState<UlasanWithRelasi | null>(null)
  const [deleting, setDeleting]         = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/reviews${params}`)
      const json = await res.json()
      setReviews(json.data ?? [])
    } catch {
      toast.error('gagal memuat ulasan')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchReviews, 350)
    return () => clearTimeout(t)
  }, [fetchReviews])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/reviews?id=${deleteTarget.id_ulasan}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('gagal menghapus ulasan')
      toast.success('ulasan dihapus')
      setDeleteTarget(null)
      fetchReviews()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Moderasi Ulasan</h1>
        <p className='text-sm text-muted-foreground'>Pantau dan moderasi ulasan buku dari anggota.</p>
      </div>

      <Card className='border-none shadow-sm overflow-hidden'>
        <CardHeader className='flex flex-col sm:flex-row items-center gap-4 border-b bg-slate-50/50 p-4'>
          <div className='relative flex-1 w-full'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Cari isi ulasan...'
              className='w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary'
            />
          </div>
          <Badge variant='secondary' className='shrink-0'>{reviews.length} ulasan</Badge>
        </CardHeader>

        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-slate-50/80'>
              <TableRow>
                <TableHead className='pl-6'>Buku</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Ulasan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className='pr-6 text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className='p-4'>
                        <Skeleton className='h-10 w-full' />
                      </TableCell>
                    </TableRow>
                  ))
                : reviews.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} className='py-16 text-center'>
                        <div className='flex flex-col items-center gap-2 opacity-40'>
                          <MessageSquareIcon className='size-10' />
                          <p className='font-medium'>belum ada ulasan</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                  : reviews.map((r) => (
                      <TableRow key={r.id_ulasan} className='hover:bg-slate-50/50'>
                        <TableCell className='pl-6'>
                          <div className='flex items-center gap-2'>
                            {r.buku?.gambar_buku
                              ? <img src={r.buku.gambar_buku} alt='' className='size-9 rounded border object-cover' />
                              : <div className='size-9 rounded border bg-slate-100' />
                            }
                            <div>
                              <p className='text-sm font-semibold line-clamp-1'>{r.buku?.judul_buku ?? '-'}</p>
                              <p className='text-[10px] text-slate-400'>{r.buku?.pengarang ?? '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className='text-sm font-medium'>{r.anggota?.nama_anggota ?? '-'}</p>
                          <p className='text-[10px] text-slate-400 font-mono'>{r.anggota?.nis ?? '-'}</p>
                        </TableCell>
                        <TableCell>
                          <Stars n={r.rating} />
                          <p className='text-[10px] text-slate-400 mt-0.5'>{r.rating}/5</p>
                        </TableCell>
                        <TableCell className='max-w-xs'>
                          <p className='text-sm text-slate-600 line-clamp-2'>{r.ulasan ?? '-'}</p>
                        </TableCell>
                        <TableCell className='text-xs text-slate-500 whitespace-nowrap'>
                          {format(new Date(r.created_at), 'dd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell className='pr-6 text-right'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-red-500 hover:text-red-700 hover:bg-red-50'
                            onClick={() => setDeleteTarget(r)}
                          >
                            <TrashIcon className='size-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Ulasan?</DialogTitle>
            <DialogDescription>
              Ulasan dari <strong>{deleteTarget?.anggota?.nama_anggota}</strong> untuk buku{' '}
              <strong>{deleteTarget?.buku?.judul_buku}</strong> akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Menghapus...' : 'Hapus Ulasan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
