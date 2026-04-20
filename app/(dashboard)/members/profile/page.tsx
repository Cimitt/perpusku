'use client'

import { useState, useEffect, useRef } from 'react'
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

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

export default function ProfilePage() {
  const { user, isLoaded }      = useUser()
  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState({
    nama_anggota: '',
    nis: '',
    kelas: '',
    nomor_hp: '',
    avatar_url: '',
  })

  const fillForm = (d: ProfileData) => {
    setForm({
      nama_anggota: d.anggota?.nama_anggota ?? d.nama_pengguna ?? '',
      nis:          d.anggota?.nis ?? '',
      kelas:        d.anggota?.kelas ?? '',
      nomor_hp:     d.anggota?.nomor_hp ?? '',
      avatar_url:   d.anggota?.avatar_url ?? d.anggota?.foto ?? user?.imageUrl ?? '',
    })
  }

  useEffect(() => {
    if (!isLoaded || !user) return
    fetch('/api/member/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d)
        fillForm(d)
      })
      .catch(() => toast.error('Gagal memuat profil'))
      .finally(() => setLoading(false))
  }, [isLoaded, user])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [avatarFile])

  const resetEditing = () => {
    if (profile) fillForm(profile)
    setAvatarFile(null)
    setEditing(false)
  }

  const handleAvatarChange = (file: File | null) => {
    if (!file) return
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarFile(null)
      toast.error('Avatar harus berupa JPG, PNG, atau WebP')
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarFile(null)
      toast.error('Ukuran avatar maksimal 5 MB')
      return
    }
    setAvatarFile(file)
    setEditing(true)
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return form.avatar_url || null

    const formData = new FormData()
    formData.append('file', avatarFile)

    const res = await fetch('/api/member/avatar', {
      method: 'POST',
      body: formData,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Gagal mengunggah avatar')
    return json.url as string
  }

  const handleSave = async () => {
    if (!form.nama_anggota.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      const avatarUrl = await uploadAvatar()
      const res = await fetch('/api/member/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_anggota: form.nama_anggota,
          nis:          form.nis || null,
          kelas:        form.kelas || null,
          nomor_hp:     form.nomor_hp || null,
          avatar_url:   avatarUrl,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Profil berhasil diperbarui!')
      setEditing(false)
      setAvatarFile(null)
      
      const refreshed = await fetch('/api/member/profile').then(r => r.json())
      setProfile(refreshed)
      fillForm(refreshed)
      window.dispatchEvent(new Event('profile:updated'))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.anggota?.nama_anggota ?? profile?.nama_pengguna ?? user?.fullName ?? 'Anggota'
  const avatarUrl   = avatarPreview ?? profile?.anggota?.avatar_url ?? profile?.anggota?.foto ?? user?.imageUrl

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
        <div className='h-32 bg-linear-to-br from-primary/80 via-primary/40 to-secondary/30 relative'>
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
                title='Ubah avatar'
                onClick={() => {
                  setEditing(true)
                  avatarInputRef.current?.click()
                }}
              >
                <CameraIcon className='size-4' />
              </button>
              <input
                ref={avatarInputRef}
                type='file'
                accept='image/png,image/jpeg,image/webp'
                className='sr-only'
                onChange={e => {
                  handleAvatarChange(e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
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
              <Button variant='ghost' size='sm' onClick={resetEditing} className='text-muted-foreground hover:text-foreground hover:bg-muted'>
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
               { key: 'nomor_hp',     label: 'Nomor HP', placeholder: 'Contoh: 081234567890', required: false },
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
                     type={f.key === 'nomor_hp' ? 'tel' : 'text'}
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
