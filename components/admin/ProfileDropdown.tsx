'use client'

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { LogOutIcon, UserIcon, SettingsIcon, ChevronDownIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type BackendProfile = {
  email?: string | null
  nama_pengguna?: string | null
  level?: string | null
  anggota?: {
    nama_anggota?: string | null
    avatar_url?: string | null
    foto?: string | null
    email?: string | null
  } | null
}

// helpers
function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

async function getBackendProfile(signal?: AbortSignal): Promise<BackendProfile | null> {
  const res = await fetch('/api/member/profile', {
    cache: 'no-store',
    signal,
  })

  if (!res.ok) return null

  return res.json()
}

// component
export default function ProfileDropdown() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [profile, setProfile] = useState<BackendProfile | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadProfile = async () => {
      try {
        setProfile(await getBackendProfile(controller.signal))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setProfile(null)
      }
    }

    loadProfile()

    window.addEventListener('profile:updated', loadProfile)

    return () => {
      controller.abort()
      window.removeEventListener('profile:updated', loadProfile)
    }
  }, [])

  const displayName =
    profile?.anggota?.nama_anggota ??
    profile?.nama_pengguna ??
    user?.fullName ??
    user?.username ??
    'User'
  const avatarUrl = profile?.anggota?.avatar_url ?? profile?.anggota?.foto ?? user?.imageUrl
  const email =
    profile?.anggota?.email ??
    profile?.email ??
    user?.primaryEmailAddress?.emailAddress
  const role = profile?.level ?? 'Member'

  return (
    <DropdownMenu>
      {/*
        DropdownMenuTrigger dari Base UI render <button> sendiri.
        render prop meng-override elemen itu dengan <button> kita
        supaya styling & accessible attributes ikut milik kita.
        Avatar di dalam adalah div — tidak ada nested <button>.
      */}
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Buka menu profil"
            className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          />
        }
      >
        <Avatar className="size-8 pointer-events-none ring-1 ring-border hover:ring-2 hover:ring-primary/40 transition-all">
          <AvatarImage
            src={avatarUrl ?? undefined}
            alt={displayName}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <ChevronDownIcon className="size-3 text-muted-foreground hidden sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">

        {/* ── User info header ── */}
        <DropdownMenuLabel>
          <div className="flex items-center gap-2.5 py-0.5">
            <Avatar className="size-8 shrink-0 ring-1 ring-border">
              <AvatarImage
                src={avatarUrl ?? undefined}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-sm font-semibold leading-none text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {email ?? role}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* ── Navigation items ── */}
        <DropdownMenuItem>
          <UserIcon className="mr-2 size-4" />
          Profil
        </DropdownMenuItem>

        <DropdownMenuItem>
          <SettingsIcon className="mr-2 size-4" />
          Pengaturan
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* ── Logout ── */}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
        >
          <LogOutIcon className="mr-2 size-4" />
          Keluar
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
