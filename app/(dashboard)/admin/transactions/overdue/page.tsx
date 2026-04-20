'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BellIcon, MailIcon, AlertCircleIcon, ClockIcon, UserIcon,
  BookOpenIcon, DollarSignIcon, Loader2Icon, RefreshCwIcon,
  InfoIcon, CheckCircle2Icon, MessageCircleIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// Interface disesuaikan dengan kolom v_monitoring_denda
interface MonitoringDendaRow {
  id_transaksi: number;
  qr_token?: string | null;
  nama_anggota: string;
  nis: string;
  email: string | null;
  kelas: string | null;
  judul_buku: string;
  tgl_pinjam: string;
  tgl_kembali_rencana: string;
  hari_keterlambatan: number;
  denda_realtime: number;
  denda_dibayar?: boolean;
}

interface OverdueGroup {
  key: string;
  qr_token: string | null;
  items: MonitoringDendaRow[];
  nama_anggota: string;
  nis: string;
  email: string | null;
  kelas: string | null;
  totalFine: number;
  maxDelay: number;
  nearestDueDate: string;
}

export default function OverduePage() {
  const [overdues, setOverdues] = useState<MonitoringDendaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false) // Fix Hydration
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<OverdueGroup | null>(null)
  const [payingFine, setPayingFine] = useState<number | null>(null)
  const [confirmPayItem, setConfirmPayItem] = useState<MonitoringDendaRow | null>(null)

  const supabase = createClient()

  // Mencegah hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchOverdues = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Ambil semua data overdue dari view
      const { data, error: dbError } = await supabase
        .from('v_monitoring_denda')
        .select(`
          id_transaksi, 
          nama_anggota, 
          nis, 
          email, 
          kelas, 
          judul_buku, 
          tgl_pinjam, 
          tgl_kembali_rencana, 
          hari_keterlambatan, 
          denda_realtime
        `)
        .order('hari_keterlambatan', { ascending: false })

      if (dbError) throw dbError

      const allOverdues = data || []

      // 2. Ambil ID transaksi yang dendanya sudah dibayar
      if (allOverdues.length > 0) {
        const ids = allOverdues.map(d => d.id_transaksi)
        const { data: trxRows } = await supabase
          .from('transaksi')
          .select('id_transaksi, qr_token, denda_dibayar')
          .in('id_transaksi', ids)

        // 3. Filter: hanya tampilkan yang belum dibayar
        const paidIds = new Set((trxRows || []).filter(r => r.denda_dibayar).map(r => r.id_transaksi))
        const qrTokens = new Map((trxRows || []).map(r => [r.id_transaksi, r.qr_token]))
        setOverdues(
          allOverdues
            .filter(d => !paidIds.has(d.id_transaksi))
            .map(d => ({ ...d, qr_token: qrTokens.get(d.id_transaksi) ?? null }))
        )
      } else {
        setOverdues([])
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data monitoring')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOverdues()
  }, [fetchOverdues])

  const handleSendGroupBill = async (group: OverdueGroup) => {
    if (!group.email) {
      toast.error(`Email tidak ditemukan!`);
      return;
    }

    try {
      setSendingEmail(group.key);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: group.email,
          nama: group.nama_anggota,
          nis: group.nis,
          kelas: group.kelas,
          qr_token: group.qr_token,
          buku: `${group.items.length} buku terlambat`,
          denda: group.totalFine,
          hari: group.maxDelay,
          books: group.items.map((item) => ({
            judul_buku: item.judul_buku,
            tgl_kembali_rencana: item.tgl_kembali_rencana,
            hari_keterlambatan: item.hari_keterlambatan,
            denda_realtime: item.denda_realtime,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Berhasil mengirim tagihan QR ke Gmail ${group.nama_anggota}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast.error(`Gagal: ${err.message}`);
    } finally {
      setSendingEmail(null);
    }
  }

  const buildWhatsAppMessage = (group: OverdueGroup) => {
    const bookLines = group.items.flatMap((item, index) => [
      `${index + 1}. ${item.judul_buku}`,
      `   Batas kembali: ${format(new Date(item.tgl_kembali_rencana), 'dd MMMM yyyy', { locale: localeId })}`,
      `   Keterlambatan: ${item.hari_keterlambatan} hari`,
      `   Denda: Rp ${item.denda_realtime.toLocaleString('id-ID')}`,
    ])

    return [
      `Halo ${group.nama_anggota},`,
      '',
      'Kami dari Perpustakaan SMK 2 ingin menginformasikan bahwa peminjaman dalam satu QR berikut sudah melewati batas waktu pengembalian:',
      '',
      `NIS: ${group.nis}`,
      `Kelas: ${group.kelas || '-'}`,
      `QR: ${group.qr_token || group.key}`,
      '',
      ...bookLines,
      '',
      `Total buku: ${group.items.length}`,
      `Keterlambatan terlama: ${group.maxDelay} hari`,
      `Total denda: Rp ${group.totalFine.toLocaleString('id-ID')}`,
      '',
      'Mohon segera mengembalikan semua buku tersebut dan menyelesaikan administrasi denda di meja petugas perpustakaan.',
      'Abaikan pesan ini jika pembayaran sudah diselesaikan.'
    ].join('\n')
  }

  const handleSendWhatsAppGroupBill = async (group: OverdueGroup) => {
    const whatsappWindow = window.open('', '_blank')
    try {
      if (!whatsappWindow) {
        throw new Error('Popup WhatsApp diblokir browser. Izinkan popup untuk halaman ini.')
      }

      setSendingWhatsApp(group.key)
      const response = await fetch('/api/admin/transactions/overdue/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_transaksi: group.items[0].id_transaksi }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menyiapkan WhatsApp')
      }

      const message = encodeURIComponent(buildWhatsAppMessage(group))
      whatsappWindow.opener = null
      whatsappWindow.location.href = `https://web.whatsapp.com/send?phone=${result.phone}&text=${message}`
      toast.success(`Tagihan WhatsApp QR untuk ${group.nama_anggota} siap dikirim.`)
    } catch (err: any) {
      whatsappWindow?.close()
      toast.error(err.message || 'Gagal menyiapkan tagihan WhatsApp')
    } finally {
      setSendingWhatsApp(null)
    }
  }

  const handlePayFine = async (item: MonitoringDendaRow) => {
    try {
      setPayingFine(item.id_transaksi)
      const res = await fetch('/api/admin/fines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_transaksi: item.id_transaksi }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal memproses pembayaran')

      toast.success(`Denda ${item.nama_anggota} untuk "${item.judul_buku}" telah dilunasi.`)
      setConfirmPayItem(null)
      setSelectedGroup(null)
      fetchOverdues() // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses pembayaran denda')
    } finally {
      setPayingFine(null)
    }
  }

  const stats = useMemo(() => {
    const totalFine = overdues.reduce((sum, t) => sum + (t.denda_realtime || 0), 0)
    const avgDays = overdues.length > 0
      ? Math.round(overdues.reduce((sum, t) => sum + t.hari_keterlambatan, 0) / overdues.length)
      : 0
    return { totalFine, avgDays }
  }, [overdues])

  const groupedOverdues = useMemo(() => {
    const groups = overdues.reduce<Record<string, OverdueGroup>>((acc, item) => {
      const key = item.qr_token || `transaksi-${item.id_transaksi}`
      if (!acc[key]) {
        acc[key] = {
          key,
          qr_token: item.qr_token || null,
          items: [],
          nama_anggota: item.nama_anggota,
          nis: item.nis,
          email: item.email,
          kelas: item.kelas,
          totalFine: 0,
          maxDelay: 0,
          nearestDueDate: item.tgl_kembali_rencana,
        }
      }

      acc[key].items.push(item)
      acc[key].totalFine += item.denda_realtime || 0
      acc[key].maxDelay = Math.max(acc[key].maxDelay, item.hari_keterlambatan || 0)

      if (new Date(item.tgl_kembali_rencana) < new Date(acc[key].nearestDueDate)) {
        acc[key].nearestDueDate = item.tgl_kembali_rencana
      }

      return acc
    }, {})

    return Object.values(groups).sort((a, b) => b.maxDelay - a.maxDelay)
  }, [overdues])

  // Tampilkan skeleton saat server-side rendering untuk menghindari mismatch
  if (!isMounted) return <PageSkeleton />

  return (
    <div className='space-y-6 animate-in fade-in duration-500 p-4'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-red-600'>Monitoring Denda</h1>
          <p className='text-muted-foreground text-sm'>Data real-time berdasarkan view monitoring denda.</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={fetchOverdues} disabled={loading}>
            {loading ? <Loader2Icon className='mr-2 size-4 animate-spin' /> : <RefreshCwIcon className='mr-2 size-4' />}
            Sync Data
          </Button>
          <Button size='sm' variant='destructive' disabled={groupedOverdues.length === 0} onClick={() => toast.info('Fitur broadcast sedang disiapkan')}>
            <BellIcon className='mr-2 size-4' /> Broadcast Reminder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-3'>
        <StatCard title="Total Paket QR" value={groupedOverdues.length} unit="Paket" icon={<AlertCircleIcon className='text-red-600'/>} color="bg-red-50" />
        <StatCard title="Estimasi Denda" value={`Rp ${stats.totalFine.toLocaleString('id-ID')}`} icon={<DollarSignIcon className='text-amber-600'/>} color="bg-amber-50" />
        <StatCard title="Rata-rata Delay" value={stats.avgDays} unit="Hari" icon={<ClockIcon className='text-blue-600'/>} color="bg-blue-50" />
      </div>

      {/* List Section */}
      <Card className='border-none shadow-sm'>
        <CardHeader className='border-b bg-slate-50/50'>
          <CardTitle className='text-lg'>Detail Keterlambatan per QR</CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          {loading ? (
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => <Skeleton key={i} className='h-24 w-full rounded-xl' />)}
            </div>
          ) : groupedOverdues.length === 0 ? (
            <div className='text-center py-12 text-slate-500'>Semua peminjaman tepat waktu!</div>
          ) : (
            <div className='grid gap-4'>
              {groupedOverdues.map((group) => (
                <div key={group.key} className='flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50/30 transition-all gap-4'>
                  <div className='flex items-start gap-4'>
                    <div className='size-12 rounded-lg bg-red-100 flex items-center justify-center shrink-0'>
                      <UserIcon className='size-6 text-red-600' />
                    </div>
                    <div className='space-y-1'>
                      <h4 className='font-bold text-slate-900'>{group.nama_anggota}</h4>
                      <div className='flex flex-wrap gap-y-1 gap-x-4 text-sm text-slate-500'>
                        <span className='flex items-center gap-1'><UserIcon className='size-3' /> {group.nis} / {group.kelas || '-'}</span>
                        <span className='flex items-center gap-1'><BookOpenIcon className='size-3' /> {group.items.length} buku terlambat</span>
                        <span className='flex items-center gap-1 text-red-600 font-medium font-mono'>
                          <ClockIcon className='size-3' />
                          {format(new Date(group.nearestDueDate), 'dd MMM yyyy', { locale: localeId })}
                        </span>
                      </div>
                      <div className='flex gap-2 mt-2'>
                        <Badge variant='outline' className='bg-white border-red-200 text-red-700 font-bold'>
                          Telat max {group.maxDelay} Hari
                        </Badge>
                        <Badge variant='secondary' className='bg-amber-100 text-amber-800 border-none font-bold'>
                          Rp {group.totalFine.toLocaleString('id-ID')}
                        </Badge>
                        {group.qr_token && (
                          <Badge variant='outline' className='bg-white border-slate-200 text-slate-600 font-mono'>
                            QR {group.qr_token.slice(0, 10)}...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex gap-2 w-full md:w-auto'>
                    <Button size='sm' variant='outline' className='flex-1 md:flex-none' onClick={() => setSelectedGroup(group)}>Detail</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detail */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
              <InfoIcon className="size-5" /> Detail Keterlambatan QR
            </DialogTitle>
          </DialogHeader>

          {selectedGroup && (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Data Anggota</h5>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <div><p className="text-muted-foreground text-[10px]">Nama</p><p className="font-bold">{selectedGroup.nama_anggota}</p></div>
                  <div><p className="text-muted-foreground text-[10px]">NIS</p><p className="font-bold">{selectedGroup.nis}</p></div>
                  <div><p className="text-muted-foreground text-[10px]">Kelas</p><p className="font-bold">{selectedGroup.kelas || '-'}</p></div>
                  <div><p className="text-muted-foreground text-[10px]">Email</p><p className="font-bold text-blue-600 truncate">{selectedGroup.email || 'N/A'}</p></div>
                  <div className='col-span-2'><p className="text-muted-foreground text-[10px]">QR Paket</p><p className="font-bold font-mono break-all">{selectedGroup.qr_token || '-'}</p></div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Buku Terlambat dan Denda</h5>
                <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                  {selectedGroup.items.map((item) => (
                    <div key={item.id_transaksi} className="space-y-3 border p-4 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <BookOpenIcon className="size-4 text-red-600 mt-0.5 shrink-0" />
                          <div className='min-w-0'>
                            <p className="text-[10px] text-muted-foreground">Buku</p>
                            <p className="text-sm font-bold leading-tight">{item.judul_buku}</p>
                          </div>
                        </div>
                        <Badge variant='secondary' className='bg-amber-100 text-amber-800 border-none font-bold shrink-0'>
                          Rp {item.denda_realtime.toLocaleString('id-ID')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                        <div><p className="text-[10px] text-muted-foreground">Tgl Pinjam</p><p className="text-xs font-medium">{format(new Date(item.tgl_pinjam), 'dd/MM/yyyy')}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Batas Kembali</p><p className="text-xs font-bold text-red-600">{format(new Date(item.tgl_kembali_rencana), 'dd/MM/yyyy')}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Keterlambatan</p><p className="text-xs font-bold text-red-600">{item.hari_keterlambatan} hari</p></div>
                        <div className='flex items-end justify-end'>
                          <Button size='sm' variant='outline' className='border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800' onClick={() => setConfirmPayItem(item)} disabled={payingFine === item.id_transaksi}>
                            {payingFine === item.id_transaksi ? <Loader2Icon className="size-3 animate-spin mr-2" /> : <CheckCircle2Icon className='size-3 mr-2' />}
                            Bayar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-600 text-white p-5 rounded-xl flex justify-between items-center shadow-lg shadow-red-100">
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-80">Total Tagihan</p>
                  <p className="text-2xl font-black italic">Rp {selectedGroup.totalFine.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold opacity-80">Buku</p>
                  <p className="text-lg font-bold">{selectedGroup.items.length} Item</p>
                </div>
              </div>

              <div className='grid gap-2 sm:grid-cols-2'>
                <Button variant='outline' onClick={() => handleSendWhatsAppGroupBill(selectedGroup)} disabled={sendingWhatsApp === selectedGroup.key}>
                  {sendingWhatsApp === selectedGroup.key ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <MessageCircleIcon className='size-4 mr-2' />}
                  Kirim 1 Tagihan WhatsApp
                </Button>
                <Button className='bg-red-600 hover:bg-red-700' onClick={() => handleSendGroupBill(selectedGroup)} disabled={sendingEmail === selectedGroup.key}>
                  {sendingEmail === selectedGroup.key ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <MailIcon className='size-4 mr-2' />}
                  Kirim 1 Tagihan Email
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className='flex-col sm:flex-row gap-2'>
            <Button variant="ghost" onClick={() => setSelectedGroup(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Bayar Denda */}
      <Dialog open={!!confirmPayItem} onOpenChange={() => setConfirmPayItem(null)}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-emerald-700'>
              <CheckCircle2Icon className='size-5' />
              Konfirmasi Pembayaran Denda
            </DialogTitle>
            <DialogDescription>
              Pastikan anggota sudah membayar denda sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          {confirmPayItem && (
            <div className='space-y-4 py-2'>
              <div className='bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Anggota</span>
                  <span className='font-semibold text-slate-900'>{confirmPayItem.nama_anggota}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Buku</span>
                  <span className='font-semibold text-slate-900 text-right max-w-[200px] truncate'>{confirmPayItem.judul_buku}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Keterlambatan</span>
                  <span className='font-bold text-red-600'>{confirmPayItem.hari_keterlambatan} hari</span>
                </div>
              </div>

              <div className='bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between'>
                <span className='text-sm font-medium text-emerald-800'>Total Denda</span>
                <span className='text-xl font-black text-emerald-700'>Rp {confirmPayItem.denda_realtime.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='ghost' onClick={() => setConfirmPayItem(null)} disabled={payingFine !== null}>Batal</Button>
            <Button 
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
              onClick={() => { if (confirmPayItem) handlePayFine(confirmPayItem) }}
              disabled={payingFine !== null}
            >
              {payingFine !== null ? (
                <><Loader2Icon className='size-4 animate-spin mr-2' /> Memproses...</>
              ) : (
                <><CheckCircle2Icon className='size-4 mr-2' /> Konfirmasi Lunas</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Komponen Kecil ---
function StatCard({ title, value, unit = "", icon, color }: any) {
  return (
    <Card className={`${color} border-none shadow-sm`}>
      <CardContent className='p-6 flex items-center gap-4'>
        <div className='p-3 bg-white rounded-xl shadow-sm'>{icon}</div>
        <div>
          <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>{title}</p>
          <p className='text-2xl font-bold'>{value} <span className="text-xs font-normal opacity-50">{unit}</span></p>
        </div>
      </CardContent>
    </Card>
  )
}

function PageSkeleton() {
  return (
    <div className='p-8 space-y-6'>
      <Skeleton className='h-10 w-64' />
      <div className='grid grid-cols-3 gap-4'><Skeleton className='h-32 rounded-xl' /><Skeleton className='h-32 rounded-xl' /><Skeleton className='h-32 rounded-xl' /></div>
      <Skeleton className='h-96 w-full rounded-xl' />
    </div>
  )
}
