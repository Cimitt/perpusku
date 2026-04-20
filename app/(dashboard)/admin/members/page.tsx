'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SearchIcon,
  MoreVerticalIcon,
  XIcon,
  ShieldOffIcon,
  ShieldCheckIcon,
  FilterIcon,
  ChevronDownIcon,
  KeyRoundIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

import type { MemberRow } from '@/types'

function getDisplayName(m: MemberRow) {
  return m.anggota?.nama_anggota || m.nama_pengguna || m.email
}

function getInitials(m: MemberRow) {
  const name = getDisplayName(m)
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DeactivateModal({
  member, onClose, onConfirm, loading,
}: {
  member: MemberRow
  onClose: () => void
  onConfirm: (id: number) => void
  loading: boolean
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='w-full max-w-sm rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b px-6 py-4'>
          <h2 className='text-base font-semibold text-slate-900'>Nonaktifkan Member</h2>
          <button onClick={onClose} disabled={loading} className='rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50'>
            <XIcon className='size-4' />
          </button>
        </div>
        <div className='space-y-4 px-6 py-5'>
          <div className='flex items-start gap-3 rounded-lg bg-red-50 p-3'>
            <ShieldOffIcon className='mt-0.5 size-4 text-red-500 shrink-0' />
            <p className='text-sm text-red-700'>
              Akun <span className='font-semibold'>{getDisplayName(member)}</span> akan dinonaktifkan.
              Member tidak dapat meminjam buku hingga diaktifkan kembali.
            </p>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' size='sm' onClick={onClose} disabled={loading}>Batal</Button>
            <Button size='sm' disabled={loading} onClick={() => onConfirm(member.id_pengguna)} className='bg-red-600 hover:bg-red-700 text-white gap-1.5'>
              <ShieldOffIcon className='size-3.5' />
              {loading ? 'Memproses...' : 'Nonaktifkan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivateModal({
  member, onClose, onConfirm, loading,
}: {
  member: MemberRow
  onClose: () => void
  onConfirm: (id: number) => void
  loading: boolean
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='w-full max-w-sm rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b px-6 py-4'>
          <h2 className='text-base font-semibold text-slate-900'>Aktifkan Member</h2>
          <button onClick={onClose} disabled={loading} className='rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50'>
            <XIcon className='size-4' />
          </button>
        </div>
        <div className='space-y-4 px-6 py-5'>
          <div className='flex items-start gap-3 rounded-lg bg-emerald-50 p-3'>
            <ShieldCheckIcon className='mt-0.5 size-4 text-emerald-600 shrink-0' />
            <p className='text-sm text-emerald-700'>
              Akun <span className='font-semibold'>{getDisplayName(member)}</span> akan diaktifkan kembali.
              Member dapat mengakses layanan perpustakaan lagi.
            </p>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' size='sm' onClick={onClose} disabled={loading}>Batal</Button>
            <Button size='sm' disabled={loading} onClick={() => onConfirm(member.id_pengguna)} className='bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5'>
              <ShieldCheckIcon className='size-3.5' />
              {loading ? 'Memproses...' : 'Aktifkan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({
  member, onClose, onConfirm, loading,
}: {
  member: MemberRow
  onClose: () => void
  onConfirm: (id: number, password: string) => void
  loading: boolean
}) {
  const [password, setPassword] = useState('')
  const isValid = password.trim().length >= 8

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='w-full max-w-sm rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b px-6 py-4'>
          <h2 className='text-base font-semibold text-slate-900'>Reset Password</h2>
          <button onClick={onClose} disabled={loading} className='rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50'>
            <XIcon className='size-4' />
          </button>
        </div>
        <div className='px-6 py-5 space-y-4'>
          <div className='flex items-start gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700'>
            <KeyRoundIcon className='size-4 shrink-0 text-blue-600 mt-0.5' />
            <p>
              Password <span className='font-semibold'>{getDisplayName(member)}</span> akan diganti.
              Sesi login lain akan dikeluarkan setelah password baru tersimpan.
            </p>
          </div>
          <div className='space-y-2'>
            <label htmlFor='new-password' className='text-sm font-medium text-slate-700'>Password Baru</label>
            <input
              id='new-password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder='Minimal 8 karakter'
              className='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50'
            />
            <p className='text-xs text-slate-500'>Berikan password baru ini langsung kepada member.</p>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' size='sm' onClick={onClose} disabled={loading}>Batal</Button>
            <Button size='sm' disabled={loading || !isValid} onClick={() => onConfirm(member.id_pengguna, password)} className='gap-1.5'>
              <KeyRoundIcon className='size-3.5' />
              {loading ? 'Memproses...' : 'Reset Password'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Aktif', value: 'true' },
  { label: 'Tidak Aktif', value: 'false' },
]

function FilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            className='inline-flex w-[160px] items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors'
          />
        }
      >
        <FilterIcon className='size-3.5 text-slate-400' />
        <span className='flex-1 text-left'>{selected.label}</span>
        <ChevronDownIcon className='size-3.5 text-slate-400' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px] z-[99]'>
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer ${opt.value === value ? 'bg-primary/5 text-primary font-medium' : ''}`}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [total, setTotal] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deactivateTarget, setDeactivateTarget] = useState<MemberRow | null>(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [activateTarget, setActivateTarget] = useState<MemberRow | null>(null)
  const [activateLoading, setActivateLoading] = useState(false)
  const [resetTarget, setResetTarget] = useState<MemberRow | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const fetchMembers = useCallback(async (q: string, status: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q)
      if (status !== 'all') params.set('status', status)
      const res = await fetch(`/api/admin/members?${params.toString()}`)
      if (!res.ok) throw new Error('gagal memuat data')
      const json = await res.json()
      setTotal(json.total ?? 0)
      setActiveCount(json.activeCount ?? 0)
      setMembers(json.data ?? [])
    } catch (err: unknown) {
      toast.error('gagal memuat data member')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchMembers(search, statusFilter), 400)
    return () => clearTimeout(timer)
  }, [search, statusFilter, fetchMembers])

  const handleDeactivateConfirm = async (id: number) => {
    setDeactivateLoading(true)
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', is_active: false }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'gagal menonaktifkan member')
      setMembers((prev) => prev.map((m) => (m.id_pengguna === id ? { ...m, is_active: false } : m)))
      setActiveCount((prev) => Math.max(0, prev - 1))
      setDeactivateTarget(null)
      toast.success('member berhasil dinonaktifkan')
    } catch (err: unknown) {
      toast.error('gagal menonaktifkan member')
    } finally {
      setDeactivateLoading(false)
    }
  }

  const handleActivateConfirm = async (id: number) => {
    setActivateLoading(true)
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', is_active: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'gagal mengaktifkan member')
      setMembers((prev) => prev.map((m) => (m.id_pengguna === id ? { ...m, is_active: true } : m)))
      setActiveCount((prev) => Math.min(total, prev + 1))
      setActivateTarget(null)
      toast.success('member berhasil diaktifkan')
    } catch (err: unknown) {
      toast.error('gagal mengaktifkan member')
    } finally {
      setActivateLoading(false)
    }
  }

  const handleResetPasswordConfirm = async (id: number, password: string) => {
    setResetLoading(true)
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'gagal reset password')
      setResetTarget(null)
      toast.success('password member berhasil direset')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'gagal reset password')
    } finally {
      setResetLoading(false)
    }
  }

  const inactiveCount = total - activeCount

  return (
    <div className='space-y-6'>
      {deactivateTarget && (
        <DeactivateModal
          member={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleDeactivateConfirm}
          loading={deactivateLoading}
        />
      )}
      {activateTarget && (
        <ActivateModal
          member={activateTarget}
          onClose={() => setActivateTarget(null)}
          onConfirm={handleActivateConfirm}
          loading={activateLoading}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          member={resetTarget}
          onClose={() => setResetTarget(null)}
          onConfirm={handleResetPasswordConfirm}
          loading={resetLoading}
        />
      )}

      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Library Members</h1>
        <p className='text-muted-foreground text-sm'>Kelola akun, status, dan akses seluruh anggota perpustakaan.</p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {[
          { label: 'Total Member', value: total, color: 'text-slate-900' },
          { label: 'Aktif', value: activeCount, color: 'text-green-600' },
          { label: 'Tidak Aktif', value: inactiveCount, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label} className='border-none shadow-sm shadow-slate-200/50'>
            <CardContent className='px-5 py-4'>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>{s.label}</p>
              <p className={`text-3xl font-bold mt-1 tabular-nums ${s.color}`}>{s.value.toLocaleString('id-ID')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='border-none shadow-sm shadow-slate-200/50'>
        <CardHeader className='flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-4 pt-4 bg-white rounded-t-xl'>
          <div className='relative w-full sm:max-w-md'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Cari nama atau email...'
              className='w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400'
            />
          </div>
          <FilterDropdown value={statusFilter} onChange={setStatusFilter} />
        </CardHeader>

        <CardContent className='p-0 overflow-x-auto'>
          <Table className='min-w-[800px]'>
            <TableHeader className='bg-slate-50/50 border-b'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='pl-6 font-semibold'>Data Member</TableHead>
                <TableHead className='font-semibold'>NIS</TableHead>
                <TableHead className='font-semibold'>Kelas</TableHead>
                <TableHead className='font-semibold'>Status</TableHead>
                <TableHead className='font-semibold'>Tanggal Bergabung</TableHead>
                <TableHead className='text-right pr-6 font-semibold'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className='pl-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='size-9 rounded-full bg-slate-100 animate-pulse' />
                        <div className='space-y-2'>
                          <div className='h-4 w-32 bg-slate-100 rounded animate-pulse' />
                          <div className='h-3 w-40 bg-slate-100 rounded animate-pulse' />
                        </div>
                      </div>
                    </TableCell>
                    {[...Array(4)].map((_, j) => (
                      <TableCell key={j}><div className='h-4 w-20 bg-slate-100 rounded animate-pulse' /></TableCell>
                    ))}
                    <TableCell className='pr-6 text-right'>
                      <div className='size-8 ml-auto bg-slate-100 rounded-full animate-pulse' />
                    </TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-16 text-center'>
                    <div className='flex flex-col items-center text-slate-400 space-y-2'>
                      <SearchIcon className='size-8 text-slate-300' />
                      <p className='text-sm'>tidak ada member yang cocok</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow
                    key={member.id_pengguna}
                    className={`hover:bg-slate-50/50 transition-colors ${!member.is_active ? 'bg-slate-50/30' : ''}`}
                  >
                    <TableCell className='pl-6 py-4'>
                      <div className={`flex items-center gap-3 ${!member.is_active && 'opacity-60'}`}>
                        <Avatar className='size-9 border border-slate-200'>
                          {member.anggota?.foto && (
                            <AvatarImage src={member.anggota.foto} alt={getDisplayName(member)} className='object-cover' />
                          )}
                          <AvatarFallback className='text-xs bg-primary/5 text-primary font-bold'>
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                          <span className='font-medium text-sm text-slate-900'>{getDisplayName(member)}</span>
                          <span className='text-xs text-slate-500'>{member.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={`text-sm font-mono text-slate-600 ${!member.is_active && 'opacity-60'}`}>
                      {member.anggota?.nis ?? '-'}
                    </TableCell>
                    <TableCell className={`text-sm text-slate-600 ${!member.is_active && 'opacity-60'}`}>
                      {member.anggota?.kelas || '-'}
                    </TableCell>
                    <TableCell>
                      {member.is_active ? (
                        <Badge className='bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-none font-medium'>Aktif</Badge>
                      ) : (
                        <Badge className='bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 shadow-none font-medium'>Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-sm text-slate-500 ${!member.is_active && 'opacity-60'}`}>
                      {formatDate(member.created_at)}
                    </TableCell>
                    <TableCell className='text-right pr-6'>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type='button'
                              className='inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              aria-label='opsi'
                            />
                          }
                        >
                          <MoreVerticalIcon className='size-4' />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-48 z-[99]'>
                          <DropdownMenuItem onClick={() => setResetTarget(member)} className='gap-2 cursor-pointer'>
                            <KeyRoundIcon className='size-4 text-slate-500' />
                            <span>Reset Password</span>
                          </DropdownMenuItem>
                          {member.is_active ? (
                            <DropdownMenuItem
                              onClick={() => setDeactivateTarget(member)}
                              className='gap-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700'
                            >
                              <ShieldOffIcon className='size-4 text-red-500' />
                              <span>Nonaktifkan Member</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setActivateTarget(member)}
                              className='gap-2 cursor-pointer text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700'
                            >
                              <ShieldCheckIcon className='size-4 text-emerald-600' />
                              <span>Aktifkan Member</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
