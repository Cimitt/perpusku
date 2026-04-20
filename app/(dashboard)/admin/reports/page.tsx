'use client'

import { useState, useCallback } from 'react'
import {
  FileTextIcon, DownloadIcon, CalendarIcon,
  BookOpenIcon, BanknoteIcon, Loader2Icon,
  SearchIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { buildAdminReportPdf, type AdminReportRow } from '@/lib/admin-report-pdf'

import type { ReportType } from '@/types'

interface ReportConfig {
  type: ReportType
  title: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
}

const REPORTS: ReportConfig[] = [
  {
    type: 'transactions',
    title: 'Laporan Transaksi',
    description: 'Rekap semua peminjaman dan pengembalian buku beserta detail anggota.',
    icon: CalendarIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    type: 'fines',
    title: 'Laporan Denda',
    description: 'Rekap total denda per anggota, lunas dan belum lunas.',
    icon: BanknoteIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    type: 'books',
    title: 'Laporan Inventaris Buku',
    description: 'Daftar lengkap koleksi buku beserta stok dan status ketersediaan.',
    icon: BookOpenIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
]

export default function ReportsPage() {
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [search, setSearch]         = useState('')
  const [generating, setGenerating] = useState<ReportType | null>(null)

  const generatePDF = useCallback(async (type: ReportType) => {
    setGenerating(type)
    try {
      const params = new URLSearchParams({ type })
      if (type === 'transactions') {
        if (dateFrom) params.set('from', dateFrom)
        if (dateTo)   params.set('to', dateTo)
      }
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`/api/admin/reports?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'gagal mengambil data')

      const rows = (json.data ?? []) as AdminReportRow[]
      if (rows.length === 0) {
        toast.warning('tidak ada data untuk diekspor')
        return
      }

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: type === 'books' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })

      buildAdminReportPdf(doc, { type, rows, dateFrom, dateTo, search })

      doc.save(`laporan-${type}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`)
      toast.success('PDF berhasil diunduh!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'gagal menghasilkan laporan')
    } finally {
      setGenerating(null)
    }
  }, [dateFrom, dateTo, search])

  return (
    <div className='space-y-6 animate-in fade-in duration-500 max-w-4xl'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Laporan dan Ekspor</h1>
        <p className='text-sm text-muted-foreground'>Unduh laporan dalam format PDF untuk kebutuhan arsip dan administrasi.</p>
      </div>

      <Card className='border-none shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base flex items-center gap-2'>
            <CalendarIcon className='size-4 text-indigo-600' />
            Filter Laporan
          </CardTitle>
          <CardDescription>Filter tanggal berlaku untuk transaksi. Pencarian berlaku untuk semua jenis laporan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end'>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-600'>Cari Data</label>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Nama, NIS, judul, kategori...'
                  className='w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                />
              </div>
            </div>
            <div className='flex-1 space-y-1'>
              <label className='text-xs font-medium text-slate-600'>Dari Tanggal</label>
              <input
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className='w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
              />
            </div>
            <div className='flex-1 space-y-1'>
              <label className='text-xs font-medium text-slate-600'>Sampai Tanggal</label>
              <input
                type='date'
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className='w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
              />
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='self-end text-slate-500'
              onClick={() => { setDateFrom(''); setDateTo(''); setSearch('') }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {REPORTS.map((r) => (
          <Card key={r.type} className='border-none shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-6 flex flex-col gap-4'>
              <div className='flex items-start justify-between'>
                <div className={`rounded-xl p-3 ${r.bg}`}>
                  <r.icon className={`size-5 ${r.color}`} />
                </div>
                <Badge variant='secondary' className='text-[10px]'>PDF</Badge>
              </div>
              <div className='flex-1 space-y-1'>
                <h3 className='text-sm font-bold text-slate-900'>{r.title}</h3>
                <p className='text-xs text-slate-500 leading-relaxed'>{r.description}</p>
              </div>
              <Button
                className='w-full gap-2'
                variant='outline'
                onClick={() => generatePDF(r.type)}
                disabled={generating === r.type}
              >
                {generating === r.type
                  ? <><Loader2Icon className='size-4 animate-spin' /> Membuat PDF...</>
                  : <><DownloadIcon className='size-4' /> Unduh PDF</>
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 space-y-1'>
        <div className='flex items-center gap-1.5 font-semibold text-slate-700'>
          <FileTextIcon className='size-3.5' />
          Tips Ekspor
        </div>
        <p>Laporan transaksi memakai data riwayat lengkap beserta denda realtime.</p>
        <p>Laporan denda menghitung sudah dibayar dari total denda dikurangi denda belum bayar.</p>
        <p>Laporan inventaris adalah snapshot stok dan ketersediaan saat PDF dibuat.</p>
      </div>
    </div>
  )
}
