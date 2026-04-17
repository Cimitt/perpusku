'use client'

import { useState } from 'react'
import {
  QrCodeIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  UserIcon,
  BookOpenIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarcodeCamera } from '@/components/admin/transactions/BarcodeCamera'
import { useQRTransaction } from '@/hooks/useQRTransaction'
import { toast } from 'sonner'

export default function ScanQRPage() {
  const { loading, error, scanQR, approveBorrow, processReturn, setError } = useQRTransaction()

  const [scanResult, setScanResult] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const handleScan = async (qrCode: string) => {
    setError(null)
    setScanResult(null)
    const result = await scanQR(qrCode)
    if (result) {
      setScanResult(result)
      try { new Audio('/sounds/beep.mp3').play().catch(() => {}) } catch {}
    }
  }

  const handleApprove = async () => {
    if (!scanResult?.request?.qr_token) return
    try {
      setProcessing(true)
      await approveBorrow(scanResult.request.qr_token)
      toast.success('Peminjaman disetujui, stok berhasil dikurangi!')
      setScanResult(null)
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyetujui peminjaman.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReturn = async () => {
    if (!scanResult?.transaction?.qr_token) return
    try {
      setProcessing(true)
      await processReturn(scanResult.transaction.qr_token)
      toast.success('Pengembalian berhasil, stok dikembalikan ke sistem!')
      setScanResult(null)
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses pengembalian.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className='max-w-5xl mx-auto space-y-8 p-6 animate-in fade-in duration-500'>
      <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
          Validator <span className="text-primary font-medium">QR Perpus</span>
        </h1>
        <p className='text-xs font-medium text-muted-foreground italic'>
          Scan akses member untuk sirkulasi buku (Auto-Stok)
        </p>
      </div>

      {error && (
        <Alert variant='destructive' className='rounded-2xl border-none bg-destructive/10 text-destructive'>
          <AlertCircleIcon className='size-4' />
          <AlertDescription className='font-bold text-xs uppercase tracking-tight'>{error}</AlertDescription>
        </Alert>
      )}

      <div className='grid gap-8 lg:grid-cols-5'>
        {/* Kolom Scanner Kiri */}
        <div className='lg:col-span-2 space-y-6'>
          <Card className='border-none shadow-xl shadow-primary/5 rounded-4xl bg-card overflow-hidden'>
            <CardHeader className='pb-2'>
              {/* Header sederhana tanpa toggle */}
              <h3 className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
                Scanner Kamera
              </h3>
            </CardHeader>
            <CardContent>
              <BarcodeCamera
                onScanSuccess={handleScan}
                disabled={loading || processing}
              />
            </CardContent>
          </Card>
        </div>

        {/* Kolom Hasil Kanan */}
        <div className='lg:col-span-3'>
          <Card className='border-none shadow-xl shadow-primary/5 rounded-4xl bg-card min-h-[400px] flex flex-col'>
            <CardHeader className='border-b border-border/40'>
              <h3 className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
                Detail Paket Transaksi
              </h3>
            </CardHeader>
            <CardContent className='flex-1 p-6'>
              {!scanResult ? (
                <div className='flex flex-col items-center justify-center h-full py-20 text-muted-foreground opacity-30'>
                  <QrCodeIcon className='size-20 mb-4 stroke-[1px]' />
                  <p className='text-xs font-bold uppercase tracking-widest italic'>
                    Menunggu scan dari member...
                  </p>
                </div>
              ) : (
                <div className='space-y-6 animate-in zoom-in-95 duration-300'>
                  {/* Info User */}
                  <div className='flex items-center gap-4 p-4 bg-secondary/10 rounded-3xl border border-secondary/20'>
                    <div className='size-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground'>
                      <UserIcon className='size-6' />
                    </div>
                    <div>
                      <p className='text-[10px] font-black text-secondary-foreground uppercase tracking-widest'>
                        Nama Member
                      </p>
                      <h4 className='font-bold text-foreground text-lg tracking-tight'>
                        {scanResult.type === 'borrow'
                          ? scanResult.request.member_name
                          : scanResult.transaction.member_name}
                      </h4>
                    </div>
                  </div>

                  {/* List Buku */}
                  <div className='space-y-3'>
                    <p className='text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2'>
                      <BookOpenIcon className='size-3' /> Daftar Koleksi Pinjaman
                    </p>
                    <div className='grid gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar'>
                      {(scanResult.request?.books || scanResult.transaction?.books || []).map((book: any, i: number) => (
                        <div key={i} className='flex items-center gap-4 p-3 bg-muted/30 rounded-3xl border border-border/50'>
                          <img
                            src={book.book_cover || book.gambar_buku || '/placeholder.png'}
                            className='size-14 rounded-2xl object-cover shadow-sm'
                            alt="cover"
                          />
                          <div className='min-w-0 flex-1'>
                            <p className='font-bold text-sm text-foreground truncate uppercase tracking-tight'>
                              {book.book_title || book.judul_buku}
                            </p>
                            <p className='text-[10px] font-medium text-muted-foreground italic'>
                              {book.book_author || book.pengarang}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Info & Actions */}
                  <div className='pt-6 border-t border-dashed border-border flex flex-col gap-4'>
                    <div className='flex justify-between items-center px-2'>
                      <div className='flex flex-col'>
                        <span className='text-[9px] font-black text-muted-foreground uppercase'>Status Info</span>
                        <span className='text-xs font-bold text-foreground'>
                          {scanResult.type === 'borrow' ? 'Menunggu Persetujuan' : 'Proses Pengembalian'}
                        </span>
                      </div>
                      <div className='text-right'>
                        <span className='text-[9px] font-black text-muted-foreground uppercase'>Deadline</span>
                        <p className='text-xs font-bold text-primary'>
                          {scanResult.type === 'borrow'
                            ? '7 Hari (Fixed)'
                            : (scanResult.transaction?.due_date
                                ? new Date(scanResult.transaction.due_date).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                  })
                                : 'Invalid Date')
                          }
                        </p>
                      </div>
                    </div>

                    <div className='flex gap-3'>
                      <Button
                        variant='outline'
                        onClick={() => setScanResult(null)}
                        className='flex-1 rounded-2xl h-12 font-bold text-xs uppercase'
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={scanResult.type === 'borrow' ? handleApprove : handleReturn}
                        disabled={processing}
                        className={`flex-[2] h-12 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                          scanResult.type === 'borrow'
                            ? 'bg-primary text-primary-foreground shadow-primary/20'
                            : 'bg-secondary text-secondary-foreground shadow-secondary/20'
                        }`}
                      >
                        {processing
                          ? <Loader2Icon className='size-4 animate-spin' />
                          : <CheckCircle2Icon className='size-4 mr-2' />
                        }
                        {scanResult.type === 'borrow' ? 'Approve & Kurangi Stok' : 'Selesaikan & Tambah Stok'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}