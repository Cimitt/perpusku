'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import {
  SettingsIcon,
  LogOutIcon,
  ShieldIcon,
  BellIcon,
  UserIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'A'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function SettingRow({
  icon,
  label,
  desc,
  action,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  action: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-4 py-3'>
      <div className='flex items-center gap-3'>
        <div className='rounded-lg bg-slate-100 p-2 text-slate-600'>{icon}</div>
        <div>
          <p className='text-sm font-medium text-slate-800'>{label}</p>
          <p className='text-xs text-slate-500'>{desc}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

export default function MemberSettingsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const displayName = user?.fullName ?? 'Anggota'

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch {
      toast.error('Gagal keluar dari akun')
    }
  }

  return (
    <div className='max-w-2xl space-y-6 animate-in fade-in duration-500'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
          <SettingsIcon className='size-6 text-slate-600' />
          Pengaturan
        </h1>
        <p className='text-sm text-muted-foreground'>Kelola preferensi dan akun kamu.</p>
      </div>

      {/* Account */}
      <Card className='border-none shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm text-slate-500 font-semibold uppercase tracking-widest'>
            Akun
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-0 divide-y'>
          {/* Profile preview */}
          <div className='flex items-center gap-4 py-4'>
            <Avatar className='size-12'>
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className='bg-indigo-100 text-indigo-700 font-bold'>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <p className='font-semibold text-slate-900'>{displayName}</p>
              <p className='text-xs text-slate-500 truncate'>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <Link href='/members/profile'>
              <Button variant='outline' size='sm' className='gap-1.5'>
                <UserIcon className='size-3.5' /> Edit Profil
              </Button>
            </Link>
          </div>

          <SettingRow
            icon={<ShieldIcon className='size-4' />}
            label='Keamanan Akun'
            desc='Kelola password dan autentikasi dua faktor via Google.'
            action={
              <a
                href='https://myaccount.google.com/security'
                target='_blank'
                rel='noopener noreferrer'
              >
                <Button variant='ghost' size='sm' className='gap-1.5 text-xs'>
                  Buka Google <ExternalLinkIcon className='size-3' />
                </Button>
              </a>
            }
          />
        </CardContent>
      </Card>

      {/* Notifications placeholder */}
      <Card className='border-none shadow-sm opacity-60'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm text-slate-500 font-semibold uppercase tracking-widest'>
            Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent className='divide-y'>
          <SettingRow
            icon={<BellIcon className='size-4' />}
            label='Pengingat Jatuh Tempo'
            desc='Notifikasi H-1 dan H-3 sebelum batas pengembalian (segera hadir).'
            action={
              <span className='rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600'>
                Coming Soon
              </span>
            }
          />
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card className='border-none shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm text-slate-500 font-semibold uppercase tracking-widest'>
            Navigasi Cepat
          </CardTitle>
        </CardHeader>
        <CardContent className='divide-y p-0'>
          {[
            { label: 'Pinjaman Aktif',     href: '/members/loans' },
            { label: 'Riwayat Peminjaman', href: '/members/history' },
            { label: 'Ulasan Saya',        href: '/members/my-reviews' },
            { label: 'Katalog Buku',       href: '/members/books' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div className='flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors'>
                <span className='text-sm text-slate-700'>{item.label}</span>
                <ChevronRightIcon className='size-4 text-slate-400' />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Sign out */}
      <div className='flex justify-end'>
        <Button
          variant='destructive'
          className='gap-2'
          onClick={handleSignOut}
        >
          <LogOutIcon className='size-4' />
          Keluar dari Akun
        </Button>
      </div>
    </div>
  )
}
