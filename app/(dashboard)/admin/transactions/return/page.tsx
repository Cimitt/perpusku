'use client'

import { useState } from 'react'
import { 
  BookOpenIcon, 
  RotateCcwIcon, 
  SearchIcon, 
  UserIcon, 
  CheckCircle2Icon,
  Loader2Icon,
  DollarSignIcon,
  CalendarIcon,
  LayersIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { BarcodeCamera } from '@/components/admin/transactions/BarcodeCamera'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// KITA HAPUS IMPORT SERVER ACTION LAMA KARENA KITA AKAN PAKAI API ROUTE BARU
// import { scanQRServer, processReturnServer } from '@/app/actions/qr'

export default function ReturnPage() {
  const [scannedCode, setScannedCode] = useState('')
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  // 1. Fungsi untuk mencari transaksi pakai API Route Baru
  const handleFindTransaction = async (qrToken: string) => {
    if (!qrToken) return
    setLoading(true)
    setTransaction(null)
    
    try {
      const res = await fetch(`/api/admin/qr?token=${qrToken}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'QR Code tidak valid atau transaksi tidak ditemukan.')
      }

      // Pastikan paket ini memang sudah dipinjam
      if (json.type !== 'return') {
         throw new Error(`Paket buku ini masih berstatus "Pending" (Belum disetujui).`)
      }

      // API kita sudah mengembalikan array "books", "member_name", "borrow_date", dan "fine"
      // Kita format ulang sedikit agar cocok dengan UI halaman ini
      const isOverdue = json.fine > 0 || new Date(json.transaction.due_date) < new Date()
      
      setTransaction({ 
        ...json.transaction, 
        denda: json.fine,
        status_transaksi: isOverdue ? 'terlambat' : 'dipinjam'
      })
      
      try {
        new Audio('/sounds/beep.mp3').play().catch(() => {})
      } catch {}

      toast.success('Transaksi ditemukan!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Fungsi untuk memproses pengembalian pakai API Route Baru
  const handleReturnProcess = async () => {
    if (!transaction?.qr_token) return
    
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_return', qr_token: transaction.qr_token })
      })
      
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses pengembalian')
      }

      toast.success(`${transaction.books.length} Buku berhasil dikembalikan. Stok bertambah!`)
      setTransaction(null)
      setScannedCode('')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className='max-w-6xl mx-auto space-y-8 p-6 animate-in fade-in duration-500'>
      {/* Header Minimalis */}
      <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
          Proses <span className="text-primary font-medium">Pengembalian</span>
        </h1>
        <p className='text-xs font-medium text-muted-foreground italic'>
          Scan QR Code untuk memvalidasi dan mengembalikan stok.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
        {/* Kolom Kiri: Scanner (Lebar 2 Kolom) */}
        <div className='lg:col-span-2 space-y-6'>
          <Card className='border-none shadow-xl shadow-primary/5 rounded-4xl bg-card overflow-hidden'>
            <CardHeader className='bg-muted/30 border-b border-border/40 pb-4'>
              <CardTitle className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>Scanner QR</CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='rounded-3xl overflow-hidden border-2 border-muted shadow-inner'>
                <BarcodeCamera 
                  onScanSuccess={(code) => {
                    setScannedCode(code)
                    handleFindTransaction(code)
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail Transaksi (Lebar 3 Kolom) */}
        <div className='lg:col-span-3'>
          <Card className='border-none shadow-xl shadow-primary/5 rounded-4xl bg-card min-h-[400px] flex flex-col'>
            <CardHeader className='border-b border-border/40 pb-4'>
              <div className='flex justify-between items-center'>
                <CardTitle className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>Informasi Paket</CardTitle>
                {transaction && (
                  <Badge className={`${transaction.status_transaksi === 'terlambat' ? 'bg-destructive/10 text-destructive' : 'bg-primary text-primary-foreground'} border-none uppercase text-[10px] font-bold px-3`}>
                    {transaction.status_transaksi === 'terlambat' ? 'Terlambat' : 'Dipinjam'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className='flex-1 p-6'>
              {!transaction ? (
                <div className='flex flex-col items-center justify-center h-full py-20 text-muted-foreground opacity-30'>
                  <RotateCcwIcon className='size-20 mb-4 stroke-[1px]' />
                  <p className='text-xs font-bold uppercase tracking-widest italic'>Menunggu input QR...</p>
                </div>
              ) : (
                <div className='space-y-6 animate-in zoom-in-95 duration-300'>
                  {/* Info Peminjam & Tanggal */}
                  <div className='grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-3xl border border-border/50'>
                    <div className='space-y-1'>
                      <p className='text-[10px] uppercase text-muted-foreground font-bold tracking-widest'>Member</p>
                      <div className='flex items-center gap-2'>
                        <UserIcon className='size-4 text-primary' />
                        {/* UPDATE: Menggunakan .member_name dari API baru */}
                        <span className='font-bold text-foreground'>{transaction.member_name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className='space-y-1 text-right'>
                      <p className='text-[10px] uppercase text-muted-foreground font-bold tracking-widest'>Tgl Pinjam</p>
                      <div className='flex items-center justify-end gap-2'>
                        <span className='font-bold text-foreground'>
                          {/* UPDATE: Menggunakan .borrow_date dari API baru */}
                          {transaction.borrow_date ? format(new Date(transaction.borrow_date), 'dd MMM yyyy', { locale: id }) : '-'}
                        </span>
                        <CalendarIcon className='size-4 text-primary' />
                      </div>
                    </div>
                  </div>

                  {/* Daftar Buku yang Dipinjam */}
                  <div className='space-y-3'>
                    <p className='text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2'>
                      <LayersIcon className='size-3' /> Daftar Buku Dikembalikan
                    </p>
                    <div className='grid gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar'>
                      {transaction.books.map((book: any, idx: number) => (
                        <div key={idx} className='flex gap-4 p-3 bg-card rounded-3xl border border-muted items-center shadow-sm'>
                          <div className='size-14 rounded-2xl bg-muted overflow-hidden shrink-0'>
                            <img src={book.gambar_buku || '/placeholder.png'} className='w-full h-full object-cover' alt="Cover" />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='font-bold text-sm text-foreground leading-tight uppercase truncate'>{book.judul_buku}</p>
                            <p className='text-[10px] font-medium text-muted-foreground truncate italic'>{book.pengarang}</p>
                            <code className='text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-1 inline-block'>{book.isbn || 'No-ISBN'}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info Denda jika ada */}
                  {transaction.status_transaksi === 'terlambat' && transaction.denda > 0 && (
                    <div className='p-4 bg-destructive/10 border border-destructive/20 rounded-3xl flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-destructive'>
                        <DollarSignIcon className='size-5' />
                        <span className='text-xs font-black uppercase tracking-widest'>Total Denda</span>
                      </div>
                      <span className='font-black text-lg text-destructive'>Rp {transaction.denda?.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {/* Tombol Proses */}
                  <Button 
                    className='w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:opacity-90 transition-all active:scale-95' 
                    onClick={handleReturnProcess}
                    disabled={processing}
                  >
                    {processing ? (
                      <><Loader2Icon className='mr-2 animate-spin size-5' /> Memulihkan Stok...</>
                    ) : (
                      <><CheckCircle2Icon className='mr-2 size-5' /> Kembalikan {transaction.books.length} Buku</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}