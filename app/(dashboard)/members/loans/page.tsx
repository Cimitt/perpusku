'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import QRCode from 'qrcode'
import {
  QrCodeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanIcon,
  Loader2Icon,
  DownloadIcon,
  BookOpenIcon,
  CalendarIcon,
  InfoIcon,
  RotateCwIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function MyLoansMobilePage() {
  const { user, isLoaded } = useUser()
  const [groupedLoans, setGroupedLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [extending, setExtending] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showBooksDialog, setShowBooksDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // fetch data dari api
  const loadTransaksi = useCallback(async () => {
    if (!isLoaded || !user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/member/loans?status=${activeTab}`)
      
      if (!res.ok) throw new Error('Gagal memuat data')
      
      const json = await res.json()
      const rawData = json.data || [] // Ambil array dari properti "data" sesuai response API-mu

      // Kelompokkan data berdasarkan qr_token (untuk buku yang dipinjam bersamaan)
      const groups = rawData.reduce((acc: any, item: any) => {
        const token = item.qr_token || `temp-${item.id_transaksi}`
        if (!acc[token]) {
          acc[token] = {
            ids: [], // Simpan semua id_transaksi dalam 1 grup untuk keperluan cancel
            qr_token: item.qr_token,
            status: item.status_transaksi,
            deadline: item.tgl_kembali_rencana,
            jml_perpanjangan: item.jml_perpanjangan || 0,
            books: []
          }
        }
        acc[token].ids.push(item.id_transaksi)
        if (item.buku) acc[token].books.push(item.buku)
        return acc
      }, {})

      setGroupedLoans(Object.values(groups || {}))
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [isLoaded, user, activeTab])

  useEffect(() => { loadTransaksi() }, [loadTransaksi])

  // perpanjang peminjaman
  const handleExtend = async (qrToken: string) => {
    if (!confirm('Perpanjang masa pinjam 7 hari? (Hanya bisa 1x)')) return
    
    setExtending(true)
    try {
      const res = await fetch('/api/member/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: qrToken })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memperpanjang')
      
      toast.success(data.message || 'Berhasil diperpanjang')
      loadTransaksi() 
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setExtending(false)
    }
  }

  // batalkan peminjaman (menggunakan api patch)
  const handleCancel = async (group: any) => {
    if (!confirm('Apakah kamu yakin ingin membatalkan seluruh paket peminjaman ini?')) return
    
    try {
      // Karena 1 QR Code bisa berisi beberapa buku (banyak id_transaksi),
      // kita loop semua id_transaksi di dalam grup tersebut ke endpoint PATCH-mu
      await Promise.all(
        group.ids.map(async (id: number) => {
          const res = await fetch(`/api/member/loans?id=${id}`, { method: 'PATCH' })
          if (!res.ok) throw new Error('Gagal membatalkan sebagian transaksi')
        })
      )
      
      toast.success('Paket peminjaman berhasil dibatalkan')
      loadTransaksi() 
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // fungsi tampilkan & unduh qr
  const handleShowQR = async (group: any) => {
    setSelectedGroup(group)
    setShowQRDialog(true)
    if (group.qr_token) {
      try {
        const url = await QRCode.toDataURL(group.qr_token, { 
          width: 600, 
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        })
        setQrDataUrl(url)
      } catch (err) {
        toast.error("Gagal membuat QR")
      }
    }
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl) return toast.error("QR Code belum siap");
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Akses_Pinjaman_${selectedGroup?.ids[0] || 'Perpus'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengunduh ke galeri");
  }

  const getStatusInfo = (status: string) => {
    const s: any = {
      pending: { color: 'bg-accent text-accent-foreground border-accent', icon: ClockIcon, label: 'Antrean' },
      dipinjam: { color: 'bg-secondary text-secondary-foreground border-secondary', icon: BookOpenIcon, label: 'Aktif' },
      dikembalikan: { color: 'bg-muted text-muted-foreground border-muted', icon: CheckCircleIcon, label: 'Selesai' },
      terlambat: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircleIcon, label: 'Telat' },
      dibatalkan: { color: 'bg-slate-100 text-slate-400 border-slate-200', icon: BanIcon, label: 'Batal' },
    }
    return s[status] || s.pending
  }

  return (
    <div className='min-h-screen bg-background pb-28'>
      <header className='top-0 z-30 bg-background/80 backdrop-blur-md px-6 py-6 border-b border-border/40'>
        <div className='flex flex-col gap-0.5'>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
            Pinjaman <span className="text-primary font-medium">Saya</span>
          </h1>
          <div className='flex items-center gap-2'>
            <span className='size-1.5 rounded-full bg-secondary animate-pulse' />
            <p className='text-[11px] font-medium text-muted-foreground italic tracking-wide'>
              Pusat akses koleksi digital
            </p>
          </div>
        </div>
      </header>

      <div className='p-4 space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid grid-cols-3 bg-muted/50 rounded-2xl h-11 p-1'>
            <TabsTrigger value='all' className='text-[10px] font-bold uppercase rounded-xl data-[state=active]:bg-card'>Semua</TabsTrigger>
            <TabsTrigger value='pending' className='text-[10px] font-bold uppercase rounded-xl data-[state=active]:bg-card'>Antrean</TabsTrigger>
            <TabsTrigger value='dipinjam' className='text-[10px] font-bold uppercase rounded-xl data-[state=active]:bg-card'>Aktif</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className='space-y-5 mt-6'>
            {loading ? (
              <div className='flex justify-center py-24'><Loader2Icon className='animate-spin text-primary size-8 opacity-20' /></div>
            ) : groupedLoans.length === 0 ? (
              <div className='text-center py-24 bg-card rounded-4xl border-2 border-dashed border-muted flex flex-col items-center'>
                <InfoIcon className="size-10 text-muted mb-3" />
                <p className='text-muted-foreground font-bold uppercase text-xs tracking-widest'>Belum ada data</p>
              </div>
            ) : (
              groupedLoans.map((group, idx) => {
                const status = getStatusInfo(group.status)
                return (
                  <Card key={idx} className='border-none shadow-xl shadow-primary/5 rounded-4xl overflow-hidden bg-card transition-all active:scale-[0.98]'>
                    <CardContent className='p-0'>
                      <div className='flex p-4 gap-4'>
                        <div 
                          className='relative size-24 shrink-0 rounded-3xl overflow-hidden bg-muted group cursor-pointer shadow-sm'
                          onClick={() => { setSelectedGroup(group); setShowBooksDialog(true); }}
                        >
                          <img 
                            src={group.books[0]?.gambar_buku || '/placeholder.png'} 
                            className='w-full h-full object-cover' 
                            alt="book" 
                          />
                          {group.books.length > 1 && (
                            <div className='absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center'>
                              <div className='bg-white/90 px-2 py-0.5 rounded-full shadow-sm'>
                                <span className='text-primary text-[10px] font-black'>+{group.books.length - 1}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className='flex-1 py-1 flex flex-col justify-between'>
                          <div className='space-y-1.5'>
                            <Badge className={`${status.color} border-none shadow-none rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider`}>
                              <status.icon className="size-2.5 mr-1" /> {status.label}
                            </Badge>
                            <h3 className='font-bold text-sm text-foreground line-clamp-1 leading-tight tracking-tight mt-1'>
                              {group.books[0]?.judul_buku}
                            </h3>
                            <p className='text-[10px] font-medium text-muted-foreground line-clamp-1 uppercase tracking-tighter'>{group.books[0]?.pengarang}</p>
                          </div>

                          <div className='flex items-center justify-between mt-2'>
                             <div className='flex items-center gap-1.5 px-2.5 py-1 bg-secondary/10 rounded-lg text-secondary-foreground border border-secondary/20'>
                               <CalendarIcon className='size-3 opacity-70' />
                               <span className='text-[9px] font-bold'>
                                 {group.deadline ? new Date(group.deadline).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '--'}
                               </span>
                             </div>
                             
                             {group.status === 'dipinjam' && (
                                <span className='text-[8px] font-bold text-muted-foreground uppercase tracking-widest'>
                                  {group.jml_perpanjangan >= 1 ? 'Maks Ext' : 'Ext: 1x'}
                                </span>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className='px-4 pb-4 pt-0 flex gap-2'>
                        {group.qr_token && (group.status === 'pending' || group.status === 'dipinjam') && (
                          <Button 
                            onClick={() => handleShowQR(group)}
                            className='flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-[11px] bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/10 transition-all active:scale-95'
                          >
                            <QrCodeIcon className='size-4 mr-2' /> Akses QR
                          </Button>
                        )}
                        
                        {group.status === 'pending' && (
                          <Button 
                            variant="secondary"
                            className='w-12 h-12 rounded-2xl bg-muted/40 text-destructive hover:bg-destructive/10 p-0 transition-all'
                            onClick={() => handleCancel(group)} 
                          >
                            <BanIcon className='size-5' />
                          </Button>
                        )}

                        {group.status === 'dipinjam' && (
                          <Button 
                            variant="secondary"
                            disabled={group.jml_perpanjangan >= 1 || extending}
                            className={`w-12 h-12 rounded-2xl p-0 transition-all shadow-sm ${
                              group.jml_perpanjangan >= 1 ? 'bg-muted text-muted-foreground opacity-50' : 'bg-secondary/20 text-secondary hover:bg-secondary/40'
                            }`}
                            onClick={() => handleExtend(group.qr_token)}
                          >
                            {extending ? <Loader2Icon className='size-4 animate-spin' /> : <RotateCwIcon className='size-4' />}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showBooksDialog} onOpenChange={setShowBooksDialog}>
        <DialogContent className='w-[92vw] max-w-md rounded-4xl p-6 border-none shadow-2xl'>
          <DialogHeader className='text-left'>
            <DialogTitle className='text-xl font-semibold tracking-tight text-foreground'>
              Isi <span className="text-primary">Pinjaman</span>
            </DialogTitle>
            <DialogDescription className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Total {selectedGroup?.books.length} Koleksi</DialogDescription>
          </DialogHeader>
          <div className='space-y-3 max-h-[45vh] overflow-y-auto pr-1 mt-4 scrollbar-hide'>
            {selectedGroup?.books.map((b: any, i: number) => (
              <div key={i} className='flex gap-4 p-3 bg-muted/30 rounded-3xl items-center border border-muted/20'>
                <img src={b.gambar_buku} className='size-14 rounded-2xl object-cover shadow-sm' alt="" />
                <div className='min-w-0'>
                  <p className='text-[11px] font-bold leading-tight text-foreground line-clamp-1'>{b.judul_buku}</p>
                  <p className='text-[9px] font-medium text-muted-foreground mt-0.5 truncate uppercase'>{b.pengarang}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className='w-[92vw] max-w-sm rounded-[3rem] p-10 border-none shadow-2xl overflow-hidden'>
          <div className='flex flex-col items-center gap-8'>
            <div className='text-center space-y-1.5'>
              <DialogTitle className='text-2xl font-semibold tracking-tight text-foreground'>Access Key</DialogTitle>
              <DialogDescription className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4'>Tunjukkan pada scanner perpustakaan</DialogDescription>
            </div>
            
            <div className='p-8 bg-white rounded-[2.5rem] border-[12px] border-muted shadow-inner flex items-center justify-center'>
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  className='size-52 mx-auto mix-blend-multiply dark:invert' 
                  alt="QR Code" 
                />
              )}
            </div>

            <Button 
              className='w-full rounded-2xl h-14 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-95'
              onClick={handleDownloadQR}
            >
              <DownloadIcon className='size-5 mr-2' /> Simpan Ke Galeri
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}