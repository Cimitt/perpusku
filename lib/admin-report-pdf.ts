import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import type { ReportType } from '@/types'

type PdfDoc = InstanceType<typeof import('jspdf').jsPDF>

export interface TransactionReportRow {
  id_transaksi: number
  nama_anggota: string | null
  nis: string | null
  kelas: string | null
  judul_buku: string | null
  nama_kategori: string | null
  tgl_pinjam: string | null
  tgl_kembali_rencana: string | null
  tgl_kembali_aktual: string | null
  status_transaksi: string | null
  denda: number | null
  denda_realtime: number | null
  denda_dibayar: boolean | null
  created_at: string | null
}

export interface FineReportRow {
  id_anggota: number
  nama_anggota: string | null
  nis?: string | null
  kelas?: string | null
  total_denda: number | null
  denda_belum_bayar: number | null
  jumlah_transaksi_denda?: number | null
  total_transaksi_denda?: number | null
}

export interface BookReportRow {
  id_buku: number
  judul_buku: string | null
  nama_kategori: string | null
  pengarang: string | null
  penerbit: string | null
  tahun_terbit: number | null
  stok: number | null
  stok_tersedia: number | null
  status: string | null
  rating_rata_rata: number | null
  jumlah_ulasan: number | null
}

export type AdminReportRow = TransactionReportRow | FineReportRow | BookReportRow

interface ReportPdfOptions {
  type: ReportType
  rows: AdminReportRow[]
  dateFrom?: string
  dateTo?: string
  search?: string
}

interface Column {
  label: string
  width: number
  align?: 'left' | 'right' | 'center'
}

interface SummaryItem {
  label: string
  value: string
}

const REPORT_TITLES: Record<ReportType, string> = {
  transactions: 'Laporan Transaksi',
  fines: 'Laporan Denda',
  books: 'Laporan Inventaris Buku',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  dipinjam: 'Dipinjam',
  dikembalikan: 'Dikembalikan',
  terlambat: 'Terlambat',
  dibatalkan: 'Dibatalkan',
}

function text(value: unknown, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function money(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value ?? 0)
  return `Rp ${Math.max(numberValue, 0).toLocaleString('id-ID')}`
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function shortDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return format(date, 'dd/MM/yyyy')
}

function periodLabel(dateFrom?: string, dateTo?: string) {
  if (dateFrom && dateTo) return `${shortDate(dateFrom)} sampai ${shortDate(dateTo)}`
  if (dateFrom) return `Mulai ${shortDate(dateFrom)}`
  if (dateTo) return `Sampai ${shortDate(dateTo)}`
  return 'Semua tanggal'
}

function statusLabel(status: string | null | undefined) {
  if (!status) return '-'
  return STATUS_LABELS[status] ?? status
}

function drawHeader(
  doc: PdfDoc,
  title: string,
  period: string,
  search: string | undefined,
  summaries: SummaryItem[],
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 14

  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, pageWidth, 30, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('PerpuSmuhda', margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Sistem Perpustakaan Digital', margin, y + 6)
  doc.text(`Dicetak ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}`, pageWidth - margin, y, { align: 'right' })

  y = 42
  doc.setTextColor(20, 25, 35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(95, 105, 120)
  doc.text(`Periode: ${period}`, margin, y + 6)
  doc.text(`Filter pencarian: ${search?.trim() ? search.trim() : 'Tidak ada'}`, margin, y + 11)

  y += 22
  const cardGap = 4
  const cardWidth = (pageWidth - (margin * 2) - (cardGap * (summaries.length - 1))) / summaries.length

  summaries.forEach((item, index) => {
    const x = margin + index * (cardWidth + cardGap)
    doc.setFillColor(240, 253, 250)
    doc.setDrawColor(153, 246, 228)
    doc.roundedRect(x, y, cardWidth, 18, 2, 2, 'FD')
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(item.label.toUpperCase(), x + 4, y + 6)
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(item.value, x + 4, y + 13)
  })

  return y + 28
}

function drawFooter(doc: PdfDoc) {
  const totalPages = doc.getNumberOfPages()

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('PerpuSmuhda - dokumen otomatis', 14, pageHeight - 8)
    doc.text(`Halaman ${page} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }
}

function drawTableHeader(doc: PdfDoc, columns: Column[], x: number, y: number) {
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0)

  doc.setFillColor(20, 184, 166)
  doc.rect(x, y, totalWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)

  let cx = x
  columns.forEach((column) => {
    const tx = column.align === 'right' ? cx + column.width - 2 : cx + 2
    doc.text(column.label, tx, y + 5.4, { align: column.align ?? 'left' })
    cx += column.width
  })

  return y + 8
}

function drawTable(doc: PdfDoc, columns: Column[], rows: string[][], startY: number) {
  const margin = 14
  const pageHeight = doc.internal.pageSize.getHeight()
  const bottomLimit = pageHeight - 18
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0)
  let y = drawTableHeader(doc, columns, margin, startY)

  rows.forEach((row, rowIndex) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)

    const wrappedCells = row.map((cell, index) => doc.splitTextToSize(text(cell), columns[index].width - 4))
    const lineCount = Math.max(...wrappedCells.map((cell) => cell.length), 1)
    const rowHeight = Math.max(7, lineCount * 3.3 + 4)

    if (y + rowHeight > bottomLimit) {
      doc.addPage()
      y = drawTableHeader(doc, columns, margin, 18)
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, totalWidth, rowHeight, 'F')
    }

    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y + rowHeight, margin + totalWidth, y + rowHeight)
    doc.setTextColor(15, 23, 42)

    let cx = margin
    wrappedCells.forEach((lines, columnIndex) => {
      const column = columns[columnIndex]
      const tx = column.align === 'right' ? cx + column.width - 2 : cx + 2
      doc.text(lines, tx, y + 4.5, {
        align: column.align ?? 'left',
        baseline: 'top',
      })
      cx += column.width
    })

    y += rowHeight
  })
}

function transactionReport(rows: TransactionReportRow[]) {
  const totalDenda = rows.reduce((sum, row) => sum + Math.max(numberValue(row.denda), numberValue(row.denda_realtime)), 0)
  const belumLunas = rows.reduce((sum, row) => {
    const denda = Math.max(numberValue(row.denda), numberValue(row.denda_realtime))
    return row.denda_dibayar ? sum : sum + denda
  }, 0)

  return {
    summaries: [
      { label: 'Total Transaksi', value: rows.length.toLocaleString('id-ID') },
      { label: 'Dipinjam', value: rows.filter((row) => row.status_transaksi === 'dipinjam').length.toLocaleString('id-ID') },
      { label: 'Terlambat', value: rows.filter((row) => row.status_transaksi === 'terlambat').length.toLocaleString('id-ID') },
      { label: 'Denda Belum Lunas', value: money(belumLunas) },
    ],
    columns: [
      { label: 'No', width: 9, align: 'center' as const },
      { label: 'Anggota', width: 34 },
      { label: 'Buku', width: 43 },
      { label: 'Pinjam', width: 20 },
      { label: 'Jatuh Tempo', width: 20 },
      { label: 'Kembali', width: 20 },
      { label: 'Status', width: 20 },
      { label: 'Denda', width: 24, align: 'right' as const },
    ],
    rows: rows.map((row, index) => [
      String(index + 1),
      `${text(row.nama_anggota)}\n${text(row.nis, 'NIS -')} / ${text(row.kelas, 'Kelas -')}`,
      `${text(row.judul_buku)}\n${text(row.nama_kategori)}`,
      shortDate(row.tgl_pinjam ?? row.created_at),
      shortDate(row.tgl_kembali_rencana),
      shortDate(row.tgl_kembali_aktual),
      statusLabel(row.status_transaksi),
      Math.max(numberValue(row.denda), numberValue(row.denda_realtime)) > 0 ? money(Math.max(numberValue(row.denda), numberValue(row.denda_realtime))) : '-',
    ]),
    note: `Total denda: ${money(totalDenda)}`,
  }
}

function fineReport(rows: FineReportRow[]) {
  const totalDenda = rows.reduce((sum, row) => sum + numberValue(row.total_denda), 0)
  const belumLunas = rows.reduce((sum, row) => sum + numberValue(row.denda_belum_bayar), 0)
  const sudahDibayar = Math.max(totalDenda - belumLunas, 0)

  return {
    summaries: [
      { label: 'Anggota Berdenda', value: rows.length.toLocaleString('id-ID') },
      { label: 'Total Denda', value: money(totalDenda) },
      { label: 'Sudah Dibayar', value: money(sudahDibayar) },
      { label: 'Belum Dibayar', value: money(belumLunas) },
    ],
    columns: [
      { label: 'No', width: 10, align: 'center' as const },
      { label: 'Anggota', width: 55 },
      { label: 'Jumlah Trx', width: 24, align: 'center' as const },
      { label: 'Total Denda', width: 34, align: 'right' as const },
      { label: 'Sudah Dibayar', width: 34, align: 'right' as const },
      { label: 'Belum Dibayar', width: 34, align: 'right' as const },
    ],
    rows: rows.map((row, index) => {
      const total = numberValue(row.total_denda)
      const unpaid = numberValue(row.denda_belum_bayar)
      const paid = Math.max(total - unpaid, 0)

      return [
        String(index + 1),
        `${text(row.nama_anggota)}\n${text(row.nis, 'NIS -')} / ${text(row.kelas, 'Kelas -')}`,
        String(row.jumlah_transaksi_denda ?? row.total_transaksi_denda ?? 0),
        money(total),
        money(paid),
        money(unpaid),
      ]
    }),
    note: `Denda dianggap lunas jika nilai belum dibayar sudah 0.`,
  }
}

function bookReport(rows: BookReportRow[]) {
  const totalStok = rows.reduce((sum, row) => sum + numberValue(row.stok), 0)
  const tersedia = rows.reduce((sum, row) => sum + numberValue(row.stok_tersedia), 0)
  const tidakTersedia = Math.max(totalStok - tersedia, 0)

  return {
    summaries: [
      { label: 'Judul Buku', value: rows.length.toLocaleString('id-ID') },
      { label: 'Total Eksemplar', value: totalStok.toLocaleString('id-ID') },
      { label: 'Tersedia', value: tersedia.toLocaleString('id-ID') },
      { label: 'Dipinjam', value: tidakTersedia.toLocaleString('id-ID') },
    ],
    columns: [
      { label: 'No', width: 9, align: 'center' as const },
      { label: 'Judul', width: 62 },
      { label: 'Pengarang', width: 36 },
      { label: 'Penerbit', width: 34 },
      { label: 'Kategori', width: 31 },
      { label: 'Tahun', width: 16, align: 'center' as const },
      { label: 'Stok', width: 16, align: 'right' as const },
      { label: 'Ada', width: 16, align: 'right' as const },
      { label: 'Rating', width: 18, align: 'center' as const },
      { label: 'Status', width: 24 },
    ],
    rows: rows.map((row, index) => [
      String(index + 1),
      text(row.judul_buku),
      text(row.pengarang),
      text(row.penerbit),
      text(row.nama_kategori),
      text(row.tahun_terbit),
      text(row.stok, '0'),
      text(row.stok_tersedia, '0'),
      row.rating_rata_rata ? `${row.rating_rata_rata} (${row.jumlah_ulasan ?? 0})` : '-',
      text(row.status),
    ]),
    note: `Ketersediaan dihitung dari stok tersedia pada saat laporan dibuat.`,
  }
}

export function buildAdminReportPdf(doc: PdfDoc, options: ReportPdfOptions) {
  const title = REPORT_TITLES[options.type]
  const period = options.type === 'transactions' ? periodLabel(options.dateFrom, options.dateTo) : 'Snapshot saat dicetak'
  const report = options.type === 'transactions'
    ? transactionReport(options.rows as TransactionReportRow[])
    : options.type === 'fines'
      ? fineReport(options.rows as FineReportRow[])
      : bookReport(options.rows as BookReportRow[])

  const y = drawHeader(doc, title, period, options.search, report.summaries)

  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(report.note, 14, y - 5)

  drawTable(doc, report.columns, report.rows, y)
  drawFooter(doc)
}
