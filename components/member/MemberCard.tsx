'use client'

import { LibraryIcon, UserCircle } from 'lucide-react'

// Interface disesuaikan dengan skema tabel 'anggota' dan 'pengguna' di Supabase
interface MemberCardProps {
  name: string
  nis?: string | null
  kelas?: string | null
  foto?: string | null
  is_active?: boolean
  level?: 'Admin' | 'Petugas' | 'Anggota'
}

export function MemberCard({ 
  name, 
  nis, 
  kelas, 
  foto, 
  is_active = true, 
  level = 'Anggota' 
}: MemberCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary border-2 border-primary/80 p-5 text-primary-foreground shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20">
      {/* Decorative shapes menggunakan aksen putih dan secondary */}
      <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute top-10 -right-4 size-16 rounded-full bg-secondary/20" />
      <div className="absolute -bottom-8 left-1/4 size-24 rounded-full bg-secondary/10 blur-xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Box Icon menggunakan warna Secondary (Teal) agar kontras */}
            <div className="flex size-10 items-center justify-center rounded-xl shadow-sm text-secondary-foreground">
              <LibraryIcon className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                PerpuSmuhda
              </p>
              <p className="text-[9px] font-bold text-primary-foreground/70 uppercase">
                Kartu {level}
              </p>
            </div>
          </div>
          {/* Active Pulse Indicator: Menyala jika is_active dari Supabase true */}
          {is_active && (
            <div className="size-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_oklch(var(--secondary))]" title="Akun Aktif" />
          )}
        </div>

        {/* Member Info dengan Foto Profil */}
        <div className="flex items-center gap-4 mb-5">
          {/* Avatar Area */}
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-primary-foreground/20 bg-primary-foreground/10">
            {foto ? (
              // Gunakan next/image jika domain Supabase storage sudah di-whitelist di next.config.js
              <img 
                src={foto} 
                alt={`Foto profil ${name}`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle className="h-full w-full p-2 text-primary-foreground/60" />
            )}
          </div>

          {/* Text Info */}
          <div className="space-y-1 overflow-hidden">
            <p className="text-xl font-black truncate">{name}</p>
            {kelas && (
              <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest truncate">
                Kelas: {kelas}
              </p>
            )}
          </div>
        </div>

        {/* NIS - Menggunakan border-2 agar garis pemisah terlihat tebal dan solid */}
        <div className="border-t-2 border-primary-foreground/20 pt-3">
          <p className="text-[10px] font-black text-primary-foreground/70 uppercase tracking-widest mb-1">
            NIS
          </p>
          {/* Box NIS */}
          <div className="inline-block rounded-lg border-2 border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
            <p className="text-sm font-mono font-black tracking-widest">
              {nis || 'Belum diatur'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}