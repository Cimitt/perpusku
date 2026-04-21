'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  BookCheckIcon,
  ClockIcon,
  ReceiptTextIcon,
  HeartIcon,
  HomeIcon,
  LibraryIcon,
  MessageSquareIcon,
  RssIcon,
  SearchIcon,
  SettingsIcon,
  UserCircleIcon,
} from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import ProfileDropdown from '@/components/admin/ProfileDropdown'

// nav item type
interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

// nav config
const NAV_MAIN: NavItem[] = [
  { href: '/members',       label: 'Dashboard',       icon: HomeIcon,   exact: true },
  { href: '/members/books', label: 'Katalog Buku', icon: SearchIcon, exact: true },
]

const NAV_ACTIVITY: NavItem[] = [
  { href: '/members/loans',     label: 'Pinjaman Saya', icon: BookCheckIcon },
  { href: '/members/overdue',   label: 'Denda Saya',    icon: ReceiptTextIcon },
  { href: '/members/favorites', label: 'Favorit Saya',  icon: HeartIcon },
  { href: '/members/history',   label: 'Riwayat Baca',  icon: ClockIcon },
]

const NAV_COMMUNITY: NavItem[] = [
  { href: '/members/feeds',      label: 'Feed Ulasan', icon: RssIcon,          exact: true },
  { href: '/members/my-reviews', label: 'Ulasan Saya', icon: MessageSquareIcon },
]

const NAV_ACCOUNT: NavItem[] = [
  { href: '/members/profile',   label: 'Profil',      icon: UserCircleIcon },
  { href: '/members/settings',  label: 'Pengaturan',  icon: SettingsIcon },
]

// helper
function isActive(pathname: string, item: NavItem): boolean {
  return item.exact
    ? pathname === item.href || pathname === `${item.href}/`
    : pathname.startsWith(item.href)
}

// navsection
function NavSection({
  items,
  pathname,
}: {
  items: NavItem[]
  pathname: string
}) {
  return (
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive(pathname, item)}>
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  )
}

export default function MembersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()

  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
    href: '/' + pathSegments.slice(0, index + 1).join('/'),
    isLast: index === pathSegments.length - 1,
  }))

  return (
    <div className='flex h-dvh w-full overflow-hidden bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]'>
      <SidebarProvider>
        {/* 2. Sidebar secara default di shadcn sudah sticky/fixed di dalam SidebarProvider */}
        <Sidebar collapsible="offcanvas" className='border-r border-white/60 bg-white/88 backdrop-blur-xl'>
          <SidebarContent>
            {/* ── Brand / Logo ── */}
            <SidebarGroup>
              <div className='flex items-center gap-3 px-4 py-5'>
                <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_hsl(var(--primary))_0%,_#0f766e_100%)] shadow-lg shadow-primary/20'>
                  <LibraryIcon className='size-6 text-primary' />
                </div>
                <div className='flex flex-col overflow-hidden'>
                  <span className='truncate text-lg font-black tracking-tight text-slate-950'>PerpuSmuhda</span>
                  <span className='text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500'>Portal Anggota</span>
                </div>
              </div>
            </SidebarGroup>

            <Separator />

            {/* ── Main Navigation ── */}
            <SidebarGroup>
              <NavSection items={NAV_MAIN} pathname={pathname} />
            </SidebarGroup>

            {/* ── My Activity ── */}
            <SidebarGroup>
              <SidebarGroupLabel>Aktivitas Saya</SidebarGroupLabel>
              <NavSection items={NAV_ACTIVITY} pathname={pathname} />
            </SidebarGroup>

            {/* ── Community ── */}
            <SidebarGroup>
              <SidebarGroupLabel>Komunitas</SidebarGroupLabel>
              <NavSection items={NAV_COMMUNITY} pathname={pathname} />
            </SidebarGroup>

            {/* ── Account ── */}
            <SidebarGroup className='mt-auto'>
              <SidebarGroupLabel>Akun</SidebarGroupLabel>
              <NavSection items={NAV_ACCOUNT} pathname={pathname} />
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* ── Main Area ── */}
        <div className='flex h-dvh flex-1 flex-col overflow-hidden'>
          
          {/* ── Header ── */}
          <header className='sticky top-0 z-50 w-full border-b border-white/70 bg-white/72 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60'>
            <div className='flex items-center justify-between px-4 py-3 sm:px-6'>
              <div className='flex items-center gap-4'>
                <SidebarTrigger className='rounded-xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm [&_svg]:size-5!' />
                <Separator orientation='vertical' className='hidden h-5 sm:block' />
                <Breadcrumb className='hidden sm:block'>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/members'>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((crumb, i) => (
                      <div key={i} className='flex items-center'>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {crumb.isLast ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className='flex shrink-0 items-center gap-2'>
                {user?.fullName && (
                  <div className='mr-1 hidden flex-col items-end sm:flex'>
                    <span className='text-xs font-semibold leading-tight text-slate-900'>{user.fullName}</span>
                    <span className='text-[10px] uppercase tracking-[0.18em] text-slate-500'>Member</span>
                  </div>
                )}
                <ProfileDropdown />
              </div>
            </div>
          </header>

          {/* ── Content Area ── */}
          <main className='min-h-0 flex-1 overflow-y-auto'>
            <div className='mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8'>
              {children}
            </div>
          </main>

          <footer className='mt-auto border-t border-white/70 bg-white/65 backdrop-blur-xl'>
            <div className='mx-auto flex w-full max-w-7xl items-center justify-between p-4 text-sm text-muted-foreground sm:px-6'>
              <p>
                {`© ${new Date().getFullYear()} `}
                <span className='font-medium text-primary'>PerpuSmuhda</span>.
              </p>
              <div className='flex items-center gap-1.5 text-xs'>
                <ClockIcon className='size-3.5' />
                <span>v1.0.0</span>
              </div>
            </div>
          </footer>

        </div>
      </SidebarProvider>
    </div>
  )
}
