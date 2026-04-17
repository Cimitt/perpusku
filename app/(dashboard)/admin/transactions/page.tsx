'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  SearchIcon, DownloadIcon, ArrowUpRightIcon, ArrowDownLeftIcon, 
  CalendarIcon, UserCheckIcon, ChevronLeftIcon, ChevronRightIcon 
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import type { VTransaksiAktif, StatusTransaksi } from '@/types'

// --- Sub-components ---
function FilterTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
        active ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

function ActivityBadge({ status }: { status: string }) {
  const isBorrow = status !== 'dikembalikan'
  return (
    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter ${isBorrow ? 'text-blue-600' : 'text-emerald-600'}`}>
      <div className={`p-1.5 rounded-lg ${isBorrow ? 'bg-blue-100' : 'bg-emerald-100'}`}>
        {isBorrow ? <ArrowDownLeftIcon className='size-3' /> : <ArrowUpRightIcon className='size-3' />}
      </div>
      {isBorrow ? 'Pinjam' : 'Kembali'}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:      { label: 'Menunggu',     className: 'bg-yellow-50 text-yellow-700' },
    dipinjam:     { label: 'Dipinjam',     className: 'bg-blue-50 text-blue-700' },
    dikembalikan: { label: 'Dikembalikan', className: 'bg-emerald-50 text-emerald-700' },
    terlambat:    { label: 'Terlambat',    className: 'bg-red-50 text-red-700' },
    dibatalkan:   { label: 'Dibatalkan',   className: 'bg-slate-50 text-slate-600' },
  }
  const s = map[status] ?? { label: status, className: 'bg-slate-50 text-slate-600' }
  return (
    <Badge variant='outline' className={`text-[10px] font-bold border-none px-2.5 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </Badge>
  )
}

// --- Main Page ---
export default function AllTransactionsPage() {
  const [transactions, setTransactions] = useState<VTransaksiAktif[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusTransaksi | ''>('')
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10 // Ubah sesuai kebutuhan

  const supabase = createClient()

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      
      // Menghitung range untuk Supabase .range(from, to)
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('v_transaksi_aktif')
        .select('*', { count: 'exact' }) // Meminta jumlah total data (exact)
        .order('id_transaksi', { ascending: false })
        .range(from, to)

      if (statusFilter) {
        query = query.eq('status_transaksi', statusFilter)
      }
      if (search) {
        query = query.or(`nama_anggota.ilike.%${search}%,judul_buku.ilike.%${search}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      
      setTransactions(data || [])
      setTotalCount(count || 0)
    } catch (error: unknown) {
      toast.error('Gagal memuat riwayat transaksi')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, currentPage, supabase])

  // Reset ke halaman 1 jika filter atau search berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchTransactions, 400)
    return () => clearTimeout(timer)
  }, [fetchTransactions])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Riwayat Transaksi</h1>
          <p className='text-muted-foreground text-sm'>Audit aktivitas peminjaman dan pengembalian secara real-time.</p>
        </div>
        <Button variant='outline' size='sm' className='shadow-sm border-slate-200' disabled>
          <DownloadIcon className='mr-2 size-4' />
          Export Report
        </Button>
      </div>

      <Card className='border-none shadow-sm bg-white overflow-hidden'>
        <CardHeader className='flex flex-col sm:flex-row items-center gap-4 border-b bg-slate-50/50 p-4'>
          <div className='relative flex-1 w-full'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Cari member atau buku...'
              className='w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all'
            />
          </div>
          <div className='flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto'>
            <FilterTab active={!statusFilter} label='Semua' onClick={() => setStatusFilter('')} />
            <FilterTab active={statusFilter === 'dipinjam'} label='Dipinjam' onClick={() => setStatusFilter('dipinjam')} />
            <FilterTab active={statusFilter === 'dikembalikan'} label='Kembali' onClick={() => setStatusFilter('dikembalikan')} />
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-slate-50/80'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='pl-6 w-[140px]'>Aktivitas</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Buku</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right pr-6'>Denda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6} className='p-4'><Skeleton className='h-10 w-full' /></TableCell></TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-24'>
                    <div className='flex flex-col items-center opacity-30'>
                      <UserCheckIcon className='size-16 mb-4' />
                      <h3 className='text-lg font-bold'>Data Tidak Ditemukan</h3>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((trx) => (
                  <TableRow key={trx.id_transaksi} className='hover:bg-slate-50/50 transition-colors'>
                    <TableCell className='pl-6'><ActivityBadge status={trx.status_transaksi} /></TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm font-semibold text-slate-700'>{trx.nama_anggota}</span>
                        <span className='text-[10px] font-mono text-slate-400 uppercase'>{trx.nis || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col max-w-[220px]'>
                        <span className='text-sm text-slate-600 truncate font-medium'>{trx.judul_buku}</span>
                        <span className='text-[10px] text-slate-400'>{trx.nama_kategori || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2 text-xs text-slate-500'>
                        <CalendarIcon className='size-3' />
                        {trx.tgl_pinjam ? format(new Date(trx.tgl_pinjam), 'dd MMM yyyy, HH:mm', { locale: id }) : 'Menunggu...'}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={trx.status_transaksi} /></TableCell>
                    <TableCell className='text-right pr-6'>
                      <span className={`text-xs font-medium ${trx.denda_realtime > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                        {trx.denda_realtime > 0 ? `Rp ${trx.denda_realtime.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* --- Pagination Controls --- */}
          <div className='flex items-center justify-between px-6 py-4 border-t bg-slate-50/30'>
            <div className='text-xs text-slate-500'>
              Menampilkan <span className='font-bold text-slate-700'>{transactions.length}</span> dari <span className='font-bold text-slate-700'>{totalCount}</span> transaksi
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className='h-8 w-8 p-0'
              >
                <ChevronLeftIcon className='size-4' />
              </Button>
              
              <div className='text-xs font-medium'>
                Halaman {currentPage} dari {totalPages || 1}
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0 || loading}
                className='h-8 w-8 p-0'
              >
                <ChevronRightIcon className='size-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}