'use client'

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

// helpers
function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

// component
export default function ProfileDropdown() {
  const { user } = useUser()
  const { signOut } = useClerk()

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
            src={user?.imageUrl}
            alt={user?.fullName ?? 'Profile'}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {getInitials(user?.fullName)}
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
                src={user?.imageUrl}
                alt={user?.fullName ?? 'Profile'}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-sm font-semibold leading-none text-foreground">
                {user?.fullName ?? user?.username ?? 'User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
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