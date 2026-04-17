'use client'

import { useState, useCallback } from 'react'
import {
  FileTextIcon, DownloadIcon, CalendarIcon,
  BookOpenIcon, BanknoteIcon, Loader2Icon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [generating, setGenerating] = useState<ReportType | null>(null)

  const generatePDF = useCallback(async (type: ReportType) => {
    setGenerating(type)
    try {
      const params = new URLSearchParams({ type })
      if (type === 'transactions') {
        if (dateFrom) params.set('from', dateFrom)
        if (dateTo)   params.set('to', dateTo)
      }

      const res = await fetch(`/api/admin/reports?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'gagal mengambil data')

      const rows: Record<string, unknown>[] = json.data ?? []
      if (rows.length === 0) {
        toast.warning('tidak ada data untuk diekspor')
        return
      }

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: type === 'books' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })

      const pageW   = doc.internal.pageSize.getWidth()
      const marginL = 15
      const marginR = 15
      const usableW = pageW - marginL - marginR
      let y = 20

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('PerpuSmuhda — Sistem Perpustakaan Digital', marginL, y)
      y += 7

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      const cfg = REPORTS.find((r) => r.type === type)!
      doc.text(cfg.title, marginL, y)
      y += 5

      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Dicetak: ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}`, marginL, y)
      doc.setTextColor(0)
      y += 8

      doc.setDrawColor(200)
      doc.line(marginL, y, pageW - marginR, y)
      y += 6

      if (type === 'transactions') {
        const cols = [
          { label: '#', width: 10 }, { label: 'Anggota', width: 40 }, { label: 'Buku', width: 55 },
          { label: 'Tgl Pinjam', width: 28 }, { label: 'Tgl Kembali', width: 28 },
          { label: 'Status', width: 24 }, { label: 'Denda', width: 25 },
        ]
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setFillColor(240, 240, 245)
        doc.rect(marginL, y - 4, usableW, 8, 'F')
        let cx = marginL
        cols.forEach((c) => { doc.text(c.label, cx + 1, y); cx += c.width })
        y += 6
        doc.setFont('helvetica', 'normal')
        rows.forEach((row: any, idx) => {
          if (y > 270) { doc.addPage(); y = 20 }
          if (idx % 2 === 0) { doc.setFillColor(250, 250, 252); doc.rect(marginL, y - 4, usableW, 6, 'F') }
          cx = marginL
          const cells = [
            String(idx + 1),
            String(row.anggota?.nama_anggota ?? row.id_anggota ?? '-').slice(0, 20),
            String(row.buku?.judul_buku ?? '-').slice(0, 30),
            row.tgl_pinjam ? format(new Date(row.tgl_pinjam), 'dd/MM/yyyy') : '-',
            row.tgl_kembali_rencana ? format(new Date(row.tgl_kembali_rencana), 'dd/MM/yyyy') : '-',
            String(row.status_transaksi ?? '-'),
            row.denda > 0 ? formatRp(row.denda) : '-',
          ]
          cells.forEach((cell, ci) => { doc.text(cell, cx + 1, y); cx += cols[ci].width })
          y += 6
        })
      }

      if (type === 'fines') {
        const cols = [
          { label: '#', width: 10 }, { label: 'Anggota', width: 55 }, { label: 'NIS', width: 30 },
          { label: 'Kelas', width: 25 }, { label: 'Total', width: 35 }, { label: 'Dibayar', width: 35 }, { label: 'Belum', width: 35 },
        ]
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setFillColor(240, 240, 245)
        doc.rect(marginL, y - 4, usableW, 8, 'F')
        let cx = marginL
        cols.forEach((c) => { doc.text(c.label, cx + 1, y); cx += c.width })
        y += 6
        doc.setFont('helvetica', 'normal')
        rows.forEach((row: any, idx) => {
          if (y > 270) { doc.addPage(); y = 20 }
          if (idx % 2 === 0) { doc.setFillColor(250, 250, 252); doc.rect(marginL, y - 4, usableW, 6, 'F') }
          cx = marginL
          const cells = [
            String(idx + 1), String(row.nama_anggota ?? '-').slice(0, 30), String(row.nis ?? '-'),
            String(row.kelas ?? '-'), formatRp(row.total_denda ?? 0),
            formatRp(row.denda_dibayar ?? 0), formatRp(row.denda_belum_bayar ?? 0),
          ]
          cells.forEach((cell, ci) => { doc.text(cell, cx + 1, y); cx += cols[ci].width })
          y += 6
        })
      }

      if (type === 'books') {
        const cols = [
          { label: '#', width: 10 }, { label: 'Judul', width: 70 }, { label: 'Pengarang', width: 45 },
          { label: 'Kategori', width: 35 }, { label: 'Tahun', width: 20 },
          { label: 'Stok', width: 20 }, { label: 'Tersedia', width: 22 }, { label: 'Rating', width: 20 },
        ]
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setFillColor(240, 240, 245)
        doc.rect(marginL, y - 4, usableW, 8, 'F')
        let cx = marginL
        cols.forEach((c) => { doc.text(c.label, cx + 1, y); cx += c.width })
        y += 6
        doc.setFont('helvetica', 'normal')
        rows.forEach((row: any, idx) => {
          if (y > 190) { doc.addPage(); y = 20 }
          if (idx % 2 === 0) { doc.setFillColor(250, 250, 252); doc.rect(marginL, y - 4, usableW, 6, 'F') }
          cx = marginL
          const cells = [
            String(idx + 1), String(row.judul_buku ?? '-').slice(0, 38),
            String(row.pengarang ?? '-').slice(0, 22), String(row.nama_kategori ?? '-').slice(0, 18),
            String(row.tahun_terbit ?? '-'), String(row.stok ?? 0),
            String(row.stok_tersedia ?? 0), row.rating_rata_rata ? String(row.rating_rata_rata) : '-',
          ]
          cells.forEach((cell, ci) => { doc.text(cell, cx + 1, y); cx += cols[ci].width })
          y += 6
        })
      }

      const totalPages = (doc.internal as any).getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(7)
        doc.setTextColor(180)
        doc.text(
          `Halaman ${p} dari ${totalPages} — PerpuSmuhda`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        )
        doc.setTextColor(0)
      }

      doc.save(`laporan-${type}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`)
      toast.success('PDF berhasil diunduh!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'gagal menghasilkan laporan')
    } finally {
      setGenerating(null)
    }
  }, [dateFrom, dateTo])

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
            Filter Tanggal (untuk Laporan Transaksi)
          </CardTitle>
          <CardDescription>Kosongkan untuk mengambil semua data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
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
              onClick={() => { setDateFrom(''); setDateTo('') }}
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
        <p>laporan transaksi: gunakan filter tanggal untuk periode tertentu</p>
        <p>laporan denda: mencakup semua anggota yang pernah dikenai denda</p>
        <p>laporan inventaris: snapshot ketersediaan buku saat ini</p>
      </div>
    </div>
  )
}
