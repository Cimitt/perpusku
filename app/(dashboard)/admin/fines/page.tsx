'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SearchIcon, BanknoteIcon, AlertCircleIcon, CheckCircle2Icon,
  FilterIcon, RotateCcwIcon, MailIcon, Loader2Icon,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

import type { DendaAnggota } from '@/types'

function fmt(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function FinesPage() {
  const [data, setData] = useState<DendaAnggota[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [unpaidOnly, setUnpaidOnly] = useState(false)
  const [sendingEmail, setSendingEmail] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (unpaidOnly) params.set('unpaid', 'true')
      const res = await fetch(`/api/admin/fines?${params}`)
      const json = await res.json()
      setData(json.data ?? [])
    } catch {
      toast.error('gagal memuat data denda')
    } finally {
      setLoading(false)
    }
  }, [search, unpaidOnly])

  useEffect(() => {
    const t = setTimeout(fetchData, 350)
    return () => clearTimeout(t)
  }, [fetchData])

  const handleSendEmail = async (member: DendaAnggota) => {
    if (!confirm(`Kirim email tagihan sebesar Rp ${member.denda_belum_bayar.toLocaleString('id-ID')} ke ${member.nama_anggota}?`)) return
    setSendingEmail(member.id_anggota)
    try {
      const res = await fetch('/api/admin/fines/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: member.email,
          nama_anggota: member.nama_anggota,
          denda_belum_bayar: member.denda_belum_bayar,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(json.message)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'gagal kirim email')
    } finally {
      setSendingEmail(null)
    }
  }

  const totalUnpaid = data.reduce((s, d) => s + (d.denda_belum_bayar || 0), 0)
  const totalPaid   = data.reduce((s, d) => s + (d.denda_dibayar || 0), 0)
  const totalAll    = data.reduce((s, d) => s + (d.total_denda || 0), 0)

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Manajemen Denda</h1>
          <p className='text-sm text-muted-foreground'>Monitor dan kelola denda keterlambatan pengembalian buku.</p>
        </div>
        <Button variant='outline' size='sm' onClick={fetchData}>
          <RotateCcwIcon className='mr-2 size-4' /> Refresh
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        {[
          { label: 'Total Denda', value: totalAll, color: 'text-slate-700', bg: 'bg-slate-50', icon: BanknoteIcon },
          { label: 'Sudah Dibayar', value: totalPaid, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2Icon },
          { label: 'Belum Dibayar', value: totalUnpaid, color: 'text-red-700', bg: 'bg-red-50', icon: AlertCircleIcon },
        ].map((s) => (
          <Card key={s.label} className='border-none shadow-sm'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className={`rounded-lg p-2.5 ${s.bg}`}>
                <s.icon className={`size-5 ${s.color}`} />
              </div>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{fmt(s.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='border-none shadow-sm overflow-hidden'>
        <CardHeader className='flex flex-col sm:flex-row items-center gap-4 border-b bg-slate-50/50 p-4'>
          <div className='relative flex-1 w-full'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Cari nama atau NIS anggota...'
              className='w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none'
            />
          </div>
          <Button variant={unpaidOnly ? 'default' : 'outline'} size='sm' onClick={() => setUnpaidOnly((p) => !p)}>
            <FilterIcon className='mr-2 size-4' />
            {unpaidOnly ? 'Belum Bayar Saja' : 'Semua Denda'}
          </Button>
        </CardHeader>

        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-slate-50/80'>
              <TableRow>
                <TableHead className='pl-6'>Anggota</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Total Denda</TableHead>
                <TableHead>Sudah Bayar</TableHead>
                <TableHead>Belum Bayar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='pr-6 text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className='p-4'>
                      <Skeleton className='h-10 w-full' />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='py-16 text-center'>
                    <div className='flex flex-col items-center gap-2 opacity-40'>
                      <BanknoteIcon className='size-10' />
                      <p className='font-medium'>tidak ada data denda</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id_anggota} className='hover:bg-slate-50/50'>
                    <TableCell className='pl-6'>
                      <div>
                        <p className='text-sm font-semibold'>{row.nama_anggota}</p>
                        <p className='text-xs text-slate-400 font-mono'>{row.nis ?? '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm text-slate-600'>{row.kelas ?? '-'}</TableCell>
                    <TableCell className='text-sm font-semibold text-slate-700'>{fmt(row.total_denda)}</TableCell>
                    <TableCell className='text-sm text-emerald-700 font-medium'>{fmt(row.denda_dibayar)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-bold ${row.denda_belum_bayar > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {fmt(row.denda_belum_bayar)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.denda_belum_bayar > 0 ? (
                        <Badge className='bg-red-50 text-red-700 border-red-100 text-[10px]'>Belum Lunas</Badge>
                      ) : (
                        <Badge className='bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]'>Lunas</Badge>
                      )}
                    </TableCell>
                    <TableCell className='pr-6 text-right'>
                      {row.denda_belum_bayar > 0 && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 text-[10px] font-bold uppercase tracking-wider bg-white'
                          onClick={() => handleSendEmail(row)}
                          disabled={sendingEmail === row.id_anggota}
                          title={row.email ? `kirim ke ${row.email}` : 'anggota ini tidak memiliki email'}
                        >
                          {sendingEmail === row.id_anggota ? (
                            <Loader2Icon className='size-3 mr-2 animate-spin text-muted-foreground' />
                          ) : (
                            <MailIcon className={`size-3 mr-2 ${row.email ? 'text-primary' : 'text-slate-300'}`} />
                          )}
                          {sendingEmail === row.id_anggota ? 'Mengirim...' : 'Tagih'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
