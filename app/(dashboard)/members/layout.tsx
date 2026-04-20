'use client'

import type { ReactNode } from 'react'
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
              <a href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </a>
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
    // 1. Tambahkan h-screen dan overflow-hidden agar scrollbar window hilang
    <div className='flex h-screen w-full overflow-hidden'>
      <SidebarProvider>
        {/* 2. Sidebar secara default di shadcn sudah sticky/fixed di dalam SidebarProvider */}
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            {/* ── Brand / Logo ── */}
            <SidebarGroup>
              <div className='flex items-center gap-3 px-4 py-4'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary'>
                  <LibraryIcon className='size-6 text-primary-foreground' />
                </div>
                <div className='flex flex-col overflow-hidden'>
                  <span className='truncate text-lg font-semibold'>PerpuSmuhda</span>
                  <span className='text-xs text-muted-foreground'>Portal Anggota</span>
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
        {/* 3. Berikan h-screen dan overflow-hidden pada wrapper konten utama */}
        <div className='flex flex-1 flex-col h-screen overflow-hidden'>
          
          {/* ── Header ── */}
          <header className='sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full'>
            <div className='flex items-center justify-between px-4 py-3 sm:px-6'>
              <div className='flex items-center gap-4'>
                <SidebarTrigger className='[&_svg]:size-5!' />
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
                    <span className='text-xs font-semibold leading-tight'>{user.fullName}</span>
                    <span className='text-[10px] text-muted-foreground'>Member</span>
                  </div>
                )}
                <ProfileDropdown />
              </div>
            </div>
          </header>

          {/* ── Content Area ── */}
          {/* 4. Bagian ini yang akan memiliki scrollbar sendiri */}
          <main className='flex-1 overflow-y-auto bg-muted/10'>
            <div className='mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8'>
              {children}
            </div>
            
            {/* ── Footer ── */}
            {/* Footer diletakkan di dalam main agar ikut ter-scroll di bawah konten, 
                atau di luar main jika ingin footer selalu tampak (sticky bottom) */}
            <footer className='border-t bg-card mt-auto'>
              <div className='mx-auto flex w-full max-w-7xl items-center justify-between p-4 text-sm text-muted-foreground sm:px-6'>
                <p>© {new Date().getFullYear()} <span className='font-medium text-primary'>PerpuSmuhda</span>.</p>
                <div className='flex items-center gap-1.5 text-xs'>
                  <ClockIcon className='size-3.5' />
                  <span>Student Portal</span>
                </div>
              </div>
            </footer>
          </main>

        </div>
      </SidebarProvider>
    </div>
  )
}
