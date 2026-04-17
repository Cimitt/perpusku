'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  UserCircleIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CameraIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

import type { ProfileData } from '@/types'

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'A'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ProfilePage() {
  const { user, isLoaded }      = useUser()
  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const [form, setForm] = useState({
    nama_anggota: '',
    nis: '',
    kelas: '',
  })

  useEffect(() => {
    if (!isLoaded || !user) return
    fetch('/api/member/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d)
        setForm({
          nama_anggota: d.anggota?.nama_anggota ?? d.nama_pengguna ?? '',
          nis:          d.anggota?.nis ?? '',
          kelas:        d.anggota?.kelas ?? '',
        })
      })
      .catch(() => toast.error('Gagal memuat profil'))
      .finally(() => setLoading(false))
  }, [isLoaded, user])

  const handleSave = async () => {
    if (!form.nama_anggota.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/member/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_anggota: form.nama_anggota,
          nis:          form.nis || null,
          kelas:        form.kelas || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Profil berhasil diperbarui!')
      setEditing(false)
      
      const refreshed = await fetch('/api/member/profile').then(r => r.json())
      setProfile(refreshed)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.anggota?.nama_anggota ?? profile?.nama_pengguna ?? user?.fullName ?? 'Anggota'
  const avatarUrl   = profile?.anggota?.foto ?? user?.imageUrl

  if (!isLoaded || loading) {
    return (
      <div className='max-w-2xl mx-auto space-y-6'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-40 rounded-xl' />
          <Skeleton className='h-4 w-64 rounded-xl' />
        </div>
        <Skeleton className='h-64 w-full rounded-3xl border-2 border-muted' />
        <Skeleton className='h-96 w-full rounded-3xl border-2 border-muted' />
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12'>
      {/* Header */}
      <div className='space-y-1'>
        <h1 className='text-3xl font-extrabold tracking-tight text-foreground'>Profil Saya</h1>
        <p className='text-sm font-medium text-muted-foreground'>
          Kelola informasi akun dan data keanggotaan perpustakaan.
        </p>
      </div>

      {/* Hero Avatar Card */}
      <Card className='overflow-hidden border-2 border-muted bg-card shadow-sm'>
        {/* Banner - Soft Pink Gradient */}
        <div className='h-32 bg-gradient-to-br from-primary/80 via-primary/40 to-secondary/30 relative'>
           <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
           <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/20 blur-2xl" />
        </div>
        
        <CardContent className='relative px-6 pb-6'>
          {/* Avatar Section (overlapping the banner) */}
          <div className='-mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div className='relative inline-block'>
              <Avatar className='size-24 border-4 border-background shadow-md bg-muted/30'>
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} className='object-cover' />
                <AvatarFallback className='bg-primary/10 text-primary text-2xl font-black'>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              
              <button
                className='absolute bottom-0 right-0 rounded-full bg-secondary text-secondary-foreground border-2 border-background p-2 shadow-sm hover:scale-110 hover:bg-secondary/90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                title='Foto profil dikelola melalui akun Google'
                onClick={() => toast.info('Foto profil dikelola melalui akun Google di Clerk.')}
              >
                <CameraIcon className='size-4' />
              </button>
            </div>

            {/* Badges */}
            <div className='flex items-center gap-2 pb-2'>
              <Badge variant="outline" className='border-2 font-bold uppercase tracking-wider text-[10px] px-3 py-1'>
                {profile?.level ?? 'Anggota'}
              </Badge>
              {profile?.is_active && (
                <Badge className='bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 text-[10px] font-bold uppercase tracking-wider gap-1.5 px-3 py-1'>
                  <ShieldCheckIcon className='size-3' /> AKTIF
                </Badge>
              )}
            </div>
          </div>

          <div className='mt-5 space-y-1'>
            <h2 className='text-2xl font-black text-foreground'>{displayName}</h2>
            <p className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              {profile?.email ?? user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Data Anggota */}
      <Card className='border-2 border-muted bg-card shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between pb-6 border-b-2 border-muted/50'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <UserCircleIcon className='size-5 text-primary' />
            Detail Informasi
          </CardTitle>
          
          {!editing ? (
            <Button variant='outline' size='sm' onClick={() => setEditing(true)} className='gap-2 font-bold border-2 hover:bg-muted/50'>
              <EditIcon className='size-4' /> EDIT PROFIL
            </Button>
          ) : (
            <div className='flex gap-2'>
              <Button variant='ghost' size='sm' onClick={() => setEditing(false)} className='text-muted-foreground hover:text-foreground hover:bg-muted'>
                <XIcon className='size-4' /> BATAL
              </Button>
              <Button size='sm' onClick={handleSave} disabled={saving} className='gap-2 font-bold'>
                <SaveIcon className='size-4' />
                {saving ? 'MENYIMPAN...' : 'SIMPAN'}
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className='space-y-6 pt-6'>
          {/* Editable Fields */}
          <div className="grid gap-6 sm:grid-cols-2">
             {[
               { key: 'nama_anggota', label: 'Nama Lengkap', placeholder: 'Nama anggota', required: true },
               { key: 'nis',          label: 'Nomor Induk Siswa (NIS)', placeholder: 'Opsional', required: false },
               { key: 'kelas',        label: 'Kelas / Jabatan', placeholder: 'Contoh: XII IPA 1', required: false },
             ].map(f => (
               <div key={f.key} className={`space-y-2 ${f.key === 'nama_anggota' ? 'sm:col-span-2' : ''}`}>
                 <label className='text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between'>
                   {f.label}
                   {f.required && <span className="text-destructive">*</span>}
                 </label>
                 
                 {editing ? (
                   <Input
                     value={form[f.key as keyof typeof form]}
                     onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                     placeholder={f.placeholder}
                     className='h-11 border-2 border-muted bg-white focus-visible:border-primary focus-visible:ring-primary/20 font-medium'
                   />
                 ) : (
                   <div className='flex items-center min-h-11 rounded-xl border-2 border-transparent bg-muted/30 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50'>
                     {form[f.key as keyof typeof form] || <span className='text-muted-foreground/60 italic font-medium'>Belum dilengkapi</span>}
                   </div>
                 )}
               </div>
             ))}
          </div>

          <div className="border-t-2 border-muted/50 my-6" />

          {/* Read-only Fields */}
          <div className="grid gap-6 sm:grid-cols-2">
             <div className='space-y-2 sm:col-span-2'>
               <label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                 Alamat Email Terdaftar
               </label>
               <div className='flex items-center justify-between min-h-11 rounded-xl border-2 border-transparent bg-muted/30 px-4 py-2 text-sm font-semibold text-foreground'>
                 {profile?.email ?? user?.primaryEmailAddress?.emailAddress}
                 <span className='rounded-md bg-secondary/10 text-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider'>
                   Via Google
                 </span>
               </div>
             </div>

             {profile?.anggota?.id_anggota && (
               <div className='space-y-2'>
                 <label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                   ID Anggota Sistem
                 </label>
                 <div className='flex items-center min-h-11 rounded-xl border-2 border-transparent bg-muted/30 px-4 py-2 text-sm font-mono font-bold text-foreground'>
                   #{String(profile.anggota.id_anggota).padStart(6, '0')}
                 </div>
               </div>
             )}
          </div>
          
        </CardContent>
      </Card>
    </div>
  )
}