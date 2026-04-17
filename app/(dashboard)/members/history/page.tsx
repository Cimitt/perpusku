'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  ClockIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanIcon,
  StarIcon,
  Loader2Icon,
  SearchIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import type { StatusTransaksi } from '@/types'

// transaksi lokal dengan relasi buku
interface TransaksiItem {
  id_transaksi: number
  id_buku: number
  status_transaksi: StatusTransaksi
  tgl_pinjam: string | null
  tgl_kembali_rencana: string | null
  tgl_kembali_aktual: string | null
  denda: number
  denda_dibayar: boolean
  created_at: string
  buku: { judul_buku: string; pengarang: string | null; gambar_buku: string | null } | null
}

interface ReviewForm {
  id_buku: number
  id_transaksi: number
  judul: string
  rating: number
  ulasan: string
}

const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:      { label: 'Menunggu',     className: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: <ClockIcon className='size-3' /> },
  dipinjam:     { label: 'Dipinjam',     className: 'bg-blue-50 text-blue-700 border-blue-100',       icon: <BookOpenIcon className='size-3' /> },
  dikembalikan: { label: 'Dikembalikan', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircleIcon className='size-3' /> },
  terlambat:    { label: 'Terlambat',    className: 'bg-red-50 text-red-700 border-red-100',           icon: <XCircleIcon className='size-3' /> },
  dibatalkan:   { label: 'Dibatalkan',   className: 'bg-slate-50 text-slate-600 border-slate-100',     icon: <BanIcon className='size-3' /> },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.dibatalkan
  return (
    <Badge variant='outline' className={`text-[10px] flex items-center gap-1 border ${s.className}`}>
      {s.icon} {s.label}
    </Badge>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className='flex gap-1'>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type='button'
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className='transition-transform hover:scale-110'
        >
          <StarIcon
            className={`size-6 ${i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const { user, isLoaded }            = useUser()
  const [list, setList]               = useState<TransaksiItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [reviewForm, setReviewForm]   = useState<ReviewForm | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [idAnggota, setIdAnggota]     = useState<number | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) return
    fetch('/api/member/me')
      .then(r => r.json())
      .then(d => { if (d.id_anggota) setIdAnggota(d.id_anggota) })
  }, [isLoaded, user])

  const fetchHistory = useCallback(async () => {
    if (!idAnggota) return
    setLoading(true)
    try {
      const res = await fetch('/api/member/loans')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setList(json.data ?? [])
    } catch {
      toast.error('Gagal memuat riwayat')
    } finally {
      setLoading(false)
    }
  }, [idAnggota])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const filtered = list.filter(t =>
    !search || t.buku?.judul_buku.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenReview = (t: TransaksiItem) => {
    if (!t.buku) return
    setReviewForm({
      id_buku: t.id_buku,
      id_transaksi: t.id_transaksi,
      judul: t.buku.judul_buku,
      rating: 5,
      ulasan: '',
    })
  }

  const handleSubmitReview = async () => {
    if (!reviewForm || !reviewForm.ulasan.trim()) {
      toast.error('Tulis ulasan terlebih dahulu')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/member/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_buku: reviewForm.id_buku,
          rating: reviewForm.rating,
          ulasan: reviewForm.ulasan,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Ulasan berhasil dikirim!')
      setReviewForm(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengirim ulasan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='max-w-4xl space-y-6 animate-in fade-in duration-500'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Riwayat Peminjaman</h1>
        <p className='text-sm text-muted-foreground'>Semua transaksi buku yang pernah kamu lakukan.</p>
      </div>

      {/* Search */}
      <div className='relative max-w-sm'>
        <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Cari judul buku...'
          className='w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary'
        />
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {[
          { label: 'Total',        value: list.length, color: 'text-slate-700' },
          { label: 'Dikembalikan', value: list.filter(t => t.status_transaksi === 'dikembalikan').length, color: 'text-emerald-600' },
          { label: 'Terlambat',    value: list.filter(t => t.status_transaksi === 'terlambat').length, color: 'text-red-600' },
          { label: 'Denda Belum Lunas',  value: `Rp ${list.filter(t => t.denda > 0 && !t.denda_dibayar).reduce((s, t) => s + (t.denda ?? 0), 0).toLocaleString('id-ID')}`, color: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className='rounded-xl bg-white border border-slate-100 p-4 shadow-sm text-center'>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className='text-[10px] text-slate-400 mt-0.5'>{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className='flex justify-center py-16'>
          <Loader2Icon className='size-8 animate-spin text-primary/50' />
        </div>
      ) : filtered.length === 0 ? (
        <div className='rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400'>
          <BookOpenIcon className='mx-auto mb-2 size-10 text-slate-200' />
          <p className='font-medium text-sm'>Belum ada riwayat peminjaman</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filtered.map(t => (
            <Card key={t.id_transaksi} className='border-none shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  {/* Cover */}
                  {t.buku?.gambar_buku
                    ? <img src={t.buku.gambar_buku} alt={t.buku.judul_buku} className='size-14 rounded border object-cover bg-slate-100 shrink-0' />
                    : <div className='size-14 rounded border bg-slate-100 flex items-center justify-center shrink-0 text-slate-300'>
                        <BookOpenIcon className='size-5' />
                      </div>
                  }

                  {/* Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 flex-wrap'>
                      <div className='min-w-0'>
                        <p className='font-bold text-sm text-slate-900 truncate'>{t.buku?.judul_buku ?? '-'}</p>
                        <p className='text-xs text-slate-400 truncate'>{t.buku?.pengarang ?? '-'}</p>
                      </div>
                      <StatusBadge status={t.status_transaksi} />
                    </div>

                    <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500'>
                      <span>
                        Dipinjam:{' '}
                        <strong className='text-slate-700'>
                          {t.tgl_pinjam ? format(new Date(t.tgl_pinjam), 'dd MMM yyyy', { locale: id }) : '-'}
                        </strong>
                      </span>
                      {t.tgl_kembali_aktual && (
                        <span>
                          Dikembalikan:{' '}
                          <strong className='text-slate-700'>
                            {format(new Date(t.tgl_kembali_aktual), 'dd MMM yyyy', { locale: id })}
                          </strong>
                        </span>
                      )}
                      {t.denda > 0 && (
                        <span className='font-semibold text-red-600'>
                          Denda: Rp {t.denda.toLocaleString('id-ID')}
                          {t.denda_dibayar && <span className='ml-1 text-emerald-600'>(Lunas)</span>}
                        </span>
                      )}
                    </div>

                    {/* Review button for returned books */}
                    {t.status_transaksi === 'dikembalikan' && (
                      <div className='mt-3'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-xs gap-1.5 h-7'
                          onClick={() => handleOpenReview(t)}
                        >
                          <StarIcon className='size-3.5 text-amber-400' />
                          Tulis Ulasan
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewForm} onOpenChange={open => !open && setReviewForm(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Tulis Ulasan</DialogTitle>
          </DialogHeader>

          {reviewForm && (
            <div className='space-y-4'>
              <p className='text-sm font-semibold text-slate-700 line-clamp-2'>{reviewForm.judul}</p>

              <div className='space-y-1.5'>
                <label className='text-xs font-medium text-slate-600'>Rating</label>
                <StarRating
                  value={reviewForm.rating}
                  onChange={v => setReviewForm(p => p ? { ...p, rating: v } : p)}
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-medium text-slate-600'>Ulasan</label>
                <textarea
                  rows={4}
                  value={reviewForm.ulasan}
                  onChange={e => setReviewForm(p => p ? { ...p, ulasan: e.target.value } : p)}
                  placeholder='Ceritakan pengalamanmu membaca buku ini...'
                  className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none'
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setReviewForm(null)}>Batal</Button>
            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
