'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  AlertCircleIcon,
  BookOpenIcon,
  CalendarClockIcon,
  ClockIcon,
  DollarSignIcon,
  InfoIcon,
  Loader2Icon,
  ReceiptTextIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface OverdueItem {
  id_transaksi: number
  id_buku: number
  tgl_pinjam: string | null
  tgl_kembali_rencana: string | null
  tgl_kembali_aktual: string | null
  status_transaksi: string
  qr_token: string | null
  denda: number
  denda_dibayar: boolean
  hari_keterlambatan: number
  denda_realtime: number
  is_active_overdue: boolean
  is_unpaid_fine: boolean
  buku: {
    judul_buku: string
    pengarang: string | null
    gambar_buku: string | null
  } | null
}

interface OverdueSummary {
  total_denda: number
  jumlah_transaksi: number
  jumlah_buku_terlambat: number
  keterlambatan_terlama: number
}

const emptySummary: OverdueSummary = {
  total_denda: 0,
  jumlah_transaksi: 0,
  jumlah_buku_terlambat: 0,
  keterlambatan_terlama: 0,
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return format(new Date(value), 'dd MMMM yyyy', { locale: localeId })
}

function formatMoney(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export default function MemberOverduePage() {
  const { user, isLoaded } = useUser()
  const [items, setItems] = useState<OverdueItem[]>([])
  const [summary, setSummary] = useState<OverdueSummary>(emptySummary)
  const [loading, setLoading] = useState(true)

  const loadOverdue = useCallback(async () => {
    if (!isLoaded || !user) return

    setLoading(true)
    try {
      const res = await fetch('/api/member/overdue')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data denda')

      setItems(json.data ?? [])
      setSummary(json.summary ?? emptySummary)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data denda')
    } finally {
      setLoading(false)
    }
  }, [isLoaded, user])

  useEffect(() => {
    loadOverdue()
  }, [loadOverdue])

  const groupedByQr = useMemo(() => {
    const groups = items.reduce<Record<string, OverdueItem[]>>((acc, item) => {
      const key = item.qr_token || `transaksi-${item.id_transaksi}`
      acc[key] = acc[key] ?? []
      acc[key].push(item)
      return acc
    }, {})

    return Object.entries(groups).sort(([, a], [, b]) => {
      const aMax = Math.max(...a.map((item) => item.hari_keterlambatan))
      const bMax = Math.max(...b.map((item) => item.hari_keterlambatan))
      return bMax - aMax
    })
  }, [items])

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-red-700'>Denda Buku Saya</h1>
          <p className='text-sm text-muted-foreground'>
            Tagihan denda dari buku yang dipinjam oleh akun yang sedang login.
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={loadOverdue} disabled={loading}>
          {loading ? (
            <Loader2Icon className='mr-2 size-4 animate-spin' />
          ) : (
            <RefreshCwIcon className='mr-2 size-4' />
          )}
          Muat Ulang
        </Button>
      </div>

      <div className='grid gap-3 md:grid-cols-4'>
        <StatCard
          title='Total Denda'
          value={formatMoney(summary.total_denda)}
          icon={<DollarSignIcon className='size-5 text-amber-700' />}
        />
        <StatCard
          title='Transaksi Denda'
          value={summary.jumlah_transaksi}
          unit='Transaksi'
          icon={<ReceiptTextIcon className='size-5 text-red-700' />}
        />
        <StatCard
          title='Buku Terlambat'
          value={summary.jumlah_buku_terlambat}
          unit='Buku'
          icon={<BookOpenIcon className='size-5 text-sky-700' />}
        />
        <StatCard
          title='Terlama'
          value={summary.keterlambatan_terlama}
          unit='Hari'
          icon={<ClockIcon className='size-5 text-emerald-700' />}
        />
      </div>

      <Card className='rounded-lg border shadow-sm'>
        <CardHeader className='border-b'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <AlertCircleIcon className='size-5 text-red-700' />
            Detail Denda
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4 sm:p-6'>
          {loading ? (
            <div className='space-y-3'>
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className='h-28 w-full rounded-lg' />
              ))}
            </div>
          ) : groupedByQr.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center'>
              <InfoIcon className='mb-3 size-10 text-emerald-600' />
              <p className='font-semibold text-foreground'>Tidak ada denda aktif</p>
              <p className='mt-1 max-w-md text-sm text-muted-foreground'>
                Semua buku yang kamu pinjam tidak memiliki denda yang belum lunas.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {groupedByQr.map(([qrToken, group]) => {
                const totalGroupFine = group.reduce((sum, item) => sum + item.denda_realtime, 0)
                const maxDelay = Math.max(...group.map((item) => item.hari_keterlambatan))

                return (
                  <section key={qrToken} className='rounded-lg border bg-background p-4'>
                    <div className='flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between'>
                      <div className='min-w-0 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h2 className='font-semibold text-foreground'>
                            {group.length > 1 ? `${group.length} buku dalam satu pinjaman` : group[0].buku?.judul_buku ?? 'Buku'}
                          </h2>
                          <Badge variant='outline' className='border-red-200 bg-red-50 text-red-700'>
                            Telat max {maxDelay} hari
                          </Badge>
                        </div>
                        <p className='break-all text-xs text-muted-foreground'>
                          QR: {group[0].qr_token || '-'}
                        </p>
                      </div>
                      <div className='text-left sm:text-right'>
                        <p className='text-xs font-medium uppercase text-muted-foreground'>Subtotal</p>
                        <p className='text-xl font-bold text-red-700'>{formatMoney(totalGroupFine)}</p>
                      </div>
                    </div>

                    <div className='mt-4 space-y-3'>
                      {group.map((item) => (
                        <article key={item.id_transaksi} className='flex gap-3 rounded-lg border p-3'>
                          {item.buku?.gambar_buku ? (
                            <img
                              src={item.buku.gambar_buku}
                              alt={item.buku.judul_buku}
                              className='size-16 shrink-0 rounded-md border object-cover'
                            />
                          ) : (
                            <div className='flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground'>
                              <BookOpenIcon className='size-6' />
                            </div>
                          )}

                          <div className='min-w-0 flex-1 space-y-2'>
                            <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                              <div className='min-w-0'>
                                <h3 className='truncate font-semibold'>{item.buku?.judul_buku ?? 'Buku tidak ditemukan'}</h3>
                                <p className='text-xs text-muted-foreground'>{item.buku?.pengarang || 'Pengarang tidak tersedia'}</p>
                              </div>
                              <Badge className='w-fit bg-amber-100 text-amber-900 hover:bg-amber-100'>
                                {formatMoney(item.denda_realtime)}
                              </Badge>
                            </div>

                            <div className='grid gap-2 text-xs text-muted-foreground sm:grid-cols-3'>
                              <span className='flex items-center gap-1'>
                                <CalendarClockIcon className='size-3.5' />
                                Pinjam: {formatDate(item.tgl_pinjam)}
                              </span>
                              <span className='flex items-center gap-1 font-medium text-red-700'>
                                <ClockIcon className='size-3.5' />
                                Batas: {formatDate(item.tgl_kembali_rencana)}
                              </span>
                              <span>
                                Status: {item.is_active_overdue ? 'Masih dipinjam' : 'Denda belum lunas'}
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
          Denda dapat bertambah setiap hari sampai buku dikembalikan. Selesaikan pembayaran di meja petugas perpustakaan.
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  unit,
  icon,
}: {
  title: string
  value: string | number
  unit?: string
  icon: React.ReactNode
}) {
  return (
    <Card className='rounded-lg border shadow-sm'>
      <CardContent className='flex items-center gap-3 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-md bg-muted'>
          {icon}
        </div>
        <div className='min-w-0'>
          <p className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>{title}</p>
          <p className='truncate text-xl font-bold'>
            {value} {unit && <span className='text-xs font-normal text-muted-foreground'>{unit}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
