'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  BookOpenIcon,
  UsersIcon,
  RefreshCwIcon,
  BanknoteIcon,
  MessageSquareIcon,
  SettingsIcon,
  HomeIcon,
  ScanBarcodeIcon,
  TrendingUpIcon,
  ClockIcon,
  AlertCircleIcon,
  BookmarkIcon,
  LibraryIcon,
  FileTextIcon,
  RssIcon,
} from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

import ProfileDropdown from '@/components/admin/ProfileDropdown'
import { useDashboard } from '@/hooks/useDashboard'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { dashboardStats } = useDashboard()
  const { user } = useUser()

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'A'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    href: '/' + pathSegments.slice(0, index + 1).join('/'),
    isLast: index === pathSegments.length - 1,
  }))

  return (
    <div className='flex h-dvh w-full overflow-hidden'>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            {/* Logo */}
            <SidebarGroup>
              <div className='flex items-center gap-3 px-4 py-4'>
                <div className='flex size-10 items-center justify-center rounded-lg bg-primary'>
                  <LibraryIcon className='size-6 text-primary-foreground' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-lg font-semibold'>PerpuSmuhda</span>
                  <span className='text-xs text-muted-foreground'>Panel Admin</span>
                </div>
              </div>
            </SidebarGroup>

            <Separator />

            {/* Main */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin' || pathname === '/admin/'}
                    >
                      <a href='/admin'>
                        <HomeIcon />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Library Management */}
            <SidebarGroup>
              <SidebarGroupLabel>Manajemen Perpustakaan</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/members')}>
                      <a href='/admin/members'>
                        <UsersIcon />
                        <span>Anggota</span>
                      </a>
                    </SidebarMenuButton>
                    {dashboardStats?.members && (
                      <SidebarMenuBadge className='bg-primary/10 rounded-full'>
                        {dashboardStats.members.total_active}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/books')}>
                      <a href='/admin/books'>
                        <BookOpenIcon />
                        <span>Buku</span>
                      </a>
                    </SidebarMenuButton>
                    {dashboardStats?.books && (
                      <SidebarMenuBadge className='bg-primary/10 rounded-full'>
                        {dashboardStats.books.total}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/categories')}>
                      <a href='/admin/categories'>
                        <BookmarkIcon />
                        <span>Kategori</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Transactions */}
            <SidebarGroup>
              <SidebarGroupLabel>Peminjaman</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin/transactions'}
                    >
                      <a href='/admin/transactions'>
                        <RefreshCwIcon />
                        <span>Semua Peminjaman</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin/transactions/borrow'}
                    >
                      <a href='/admin/transactions/borrow'>
                        <ScanBarcodeIcon />
                        <span>Pinjam Buku</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin/transactions/return'}
                    >
                      <a href='/admin/transactions/return'>
                        <TrendingUpIcon />
                        <span>Pengembalian Buku</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin/transactions/overdue'}
                    >
                      <a href='/admin/transactions/overdue'>
                        <AlertCircleIcon />
                        <span>Terlambat</span>
                      </a>
                    </SidebarMenuButton>
                    {dashboardStats?.transactions &&
                      dashboardStats.transactions.overdue > 0 && (
                        <SidebarMenuBadge className='bg-destructive text-destructive-foreground rounded-full'>
                          {dashboardStats.transactions.overdue}
                        </SidebarMenuBadge>
                      )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Community */}
            <SidebarGroup>
              <SidebarGroupLabel>Komunitas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/reviews')}>
                      <a href='/admin/reviews'>
                        <MessageSquareIcon />
                        <span>Ulasan</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/feeds')}>
                      <a href='/admin/feeds'>
                        <RssIcon />
                        <span>Feeds</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* System */}
            <SidebarGroup>
              <SidebarGroupLabel>Sistem</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/reports')}>
                      <a href='/admin/reports'>
                        <FileTextIcon />
                        <span>Laporan</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/settings')}>
                      <a href='/admin/settings'>
                        <SettingsIcon />
                        <span>Pengaturan</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Area */}
        <div className='flex h-dvh flex-1 flex-col overflow-hidden'>
          {/* Header */}
          <header className='bg-card sticky top-0 z-50 border-b w-full'>
            <div className='flex items-center justify-between px-4 py-3 sm:px-6'>
              <div className='flex items-center gap-4'>
                <SidebarTrigger className='[&_svg]:size-5!' />
                <Separator orientation='vertical' className='hidden h-5 sm:block' />
                <Breadcrumb className='hidden sm:block'>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/admin'>Beranda</BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((crumb) => (
                      <div key={crumb.href} className='flex items-center'>
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

              <div className='flex items-center gap-1.5'>
                <ProfileDropdown />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className='min-h-0 flex-1 overflow-y-auto bg-slate-50/50'>
            <div className='mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8'>{children}</div>
          </main>

          {/* Footer */}
          <footer className='border-t bg-card mt-auto'>
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
