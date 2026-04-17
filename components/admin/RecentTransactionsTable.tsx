'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeftIcon, ChevronRightIcon, BookIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { VTransaksiAktif } from '@/types'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function RecentTransactionsTableSkeleton() {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-5 w-44 mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
        <div className="flex justify-between pt-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  dipinjam: { label: 'Dipinjam', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  dikembalikan: { label: 'Dikembalikan', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  terlambat: { label: 'Terlambat', className: 'bg-red-50 text-red-700 border-red-100' },
  dibatalkan: { label: 'Dibatalkan', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export function RecentTransactionsTable() {
  const [transactions, setTransactions] = useState<VTransaksiAktif[]>([])
  const [loading, setLoading] = useState(true)
  
  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 5 // Jumlah item per halaman (bisa disesuaikan)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Hitung range (mulai dari index ke berapa sampai ke berapa)
        const from = (currentPage - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        const { data, count, error } = await supabase
          .from('v_transaksi_aktif')
          .select('*', { count: 'exact' }) // Tambahkan { count: 'exact' } untuk mengambil total data
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) throw error

        setTransactions(data || [])
        
        // Kalkulasi total halaman
        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE))
        } else {
          setTotalPages(1)
        }
      } catch (err) {
        console.error("Gagal memuat transaksi:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [supabase, currentPage]) // Re-fetch data jika currentPage berubah

  // Fungsi dinamis pembentuk teks aksi buku
  const getActionText = (status: string) => {
    switch (status) {
      case 'dikembalikan': return 'Mengembalikan'
      case 'pending': return 'Mengajukan'
      case 'dibatalkan': return 'Batal pinjam'
      default: return 'Meminjam' // Untuk dipinjam & terlambat
    }
  }

  if (loading && transactions.length === 0) return <RecentTransactionsTableSkeleton />

  return (
    <Card className="border-none shadow-sm bg-white flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Transaksi Terbaru</h3>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            Hal {currentPage} / {totalPages || 1}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 pb-3 flex-1 flex flex-col">
        {loading ? (
           <div className="flex-1 flex justify-center items-center opacity-50"><RecentTransactionsTableSkeleton /></div>
        ) : transactions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-40">
            <BookIcon className="size-8 mb-2 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2 flex-1">
            {transactions.map((trx) => {
              const config = STATUS_CONFIG[trx.status_transaksi] ?? {
                label: trx.status_transaksi,
                className: 'bg-slate-100 text-slate-600',
              }
              const actionText = getActionText(trx.status_transaksi)

              return (
                <div
                  key={trx.id_transaksi}
                  className="flex items-start gap-3 rounded-xl bg-slate-50/50 border border-slate-100 px-3 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate pr-2">
                        {trx.nama_anggota}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 shrink-0">
                        {formatDate(trx.tgl_pinjam)}
                      </p>
                    </div>
                    
                    {/* UI DINAMIS UNTUK JUDUL BUKU */}
                    <p className="text-[10px] text-slate-500 truncate leading-snug">
                      <span className="font-semibold text-slate-600 italic mr-1">{actionText}:</span> 
                      <span className="text-slate-800">{trx.judul_buku}</span>
                    </p>
                  </div>
                  
                  <Badge
                    className={`text-[9px] font-bold shadow-none shrink-0 border uppercase tracking-widest mt-0.5 ${config.className}`}
                  >
                    {config.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}

        {/* KONTROL PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeftIcon className="size-3 mr-1" /> Prev
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next <ChevronRightIcon className="size-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}