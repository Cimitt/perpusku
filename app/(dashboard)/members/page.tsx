'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { BookOpenIcon, ZapIcon, TrendingUpIcon, SparklesIcon, LayersIcon } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActiveLoanCard } from '@/components/member/ActiveLoanCard'
import { MemberCard } from '@/components/member/MemberCard'

// local types
interface AnggotaData {
  id_anggota: number
  nama_anggota: string
  nis: string | null
  kelas: string | null
}

// Sesuaikan dengan struktur API grouping
interface BentoLoan {
  id_transaksi: number
  qr_token: string
  tgl_pinjam: string
  tgl_kembali_rencana: string
  status: string
  books: any[] // Array buku dalam paket
}

interface Stats {
  active: number
  returned: number
  overdue: number
}

// helpers
function calculateProgress(dueDateStr: string, borrowDateStr: string): number {
  const totalDays = differenceInDays(new Date(dueDateStr), new Date(borrowDateStr)) || 7
  const passedDays = differenceInDays(new Date(), new Date(borrowDateStr))
  return Math.min(Math.max((passedDays / totalDays) * 100, 0), 100)
}

function isOverdue(dueDateStr: string): boolean {
  return new Date(dueDateStr) < new Date()
}

// page
export default function MembersDashboardPage() {
  const { user, isLoaded } = useUser()
  const [anggota, setAnggota]               = useState<AnggotaData | null>(null)
  const [activeLoans, setActiveLoans]       = useState<BentoLoan[]>([])
  const [recentBooks, setRecentBooks]       = useState<any[]>([])
  const [stats, setStats]                   = useState<Stats>({ active: 0, returned: 0, overdue: 0 })
  const [loading, setLoading]               = useState(true)

  const initDashboard = useCallback(async () => {
    if (!isLoaded || !user) return
    setLoading(true)
    try {
      // 1. Fetch User Data
      const meRes = await fetch('/api/member/me')
      if (!meRes.ok) return
      const me = await meRes.json()
      if (!me.id_anggota) return

      setAnggota({
        id_anggota: me.id_anggota,
        nama_anggota: me.nama_anggota,
        nis: me.nis,
        kelas: me.kelas,
      })

      // 2. Fetch Loans (Semua transaksi)
      const allTrxRes = await fetch('/api/member/loans')
      const allTrxJson = await allTrxRes.json()
      const rawLoans = allTrxJson.data || []

      // 3. Grouping logic (Sama seperti halaman MyLoans)
      const groups = rawLoans.reduce((acc: any, item: any) => {
        const token = item.qr_token || `temp-${item.id_transaksi}`
        if (!acc[token]) {
          acc[token] = {
            id_transaksi: item.id_transaksi,
            qr_token: item.qr_token,
            status: item.status_transaksi,
            tgl_pinjam: item.tgl_pinjam,
            tgl_kembali_rencana: item.tgl_kembali_rencana,
            books: []
          }
        }
        if (item.buku) acc[token].books.push(item.buku)
        return acc
      }, {})

      const allBentoLoans: BentoLoan[] = Object.values(groups)

      // 4. Hitung Statistik berdasarkan BUKU (bukan paket) agar lebih akurat
      let activeCount = 0;
      let returnedCount = 0;
      let overdueCount = 0;

      allBentoLoans.forEach(group => {
        const bookCount = group.books.length
        if (group.status === 'dipinjam') activeCount += bookCount
        if (group.status === 'dikembalikan') returnedCount += bookCount
        if (group.status === 'terlambat') {
          activeCount += bookCount
          overdueCount += bookCount
        }
      })

      setStats({ active: activeCount, returned: returnedCount, overdue: overdueCount })

      // 5. Filter Active Loans untuk di render di Dashboard (Maks 2 paket terdekat deadline)
      const activeGroups = allBentoLoans
        .filter(g => g.status === 'dipinjam' || g.status === 'terlambat')
        .sort((a, b) => new Date(a.tgl_kembali_rencana).getTime() - new Date(b.tgl_kembali_rencana).getTime())
        .slice(0, 2)
      
      setActiveLoans(activeGroups)

      // 6. Fetch Catalog untuk New Arrivals
      const booksRes = await fetch('/api/member/catalog')
      const booksJson = await booksRes.json()
      setRecentBooks((booksJson.data ?? []).slice(0, 4))

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [isLoaded, user])

  useEffect(() => { initDashboard() }, [initDashboard])

  const displayName = anggota?.nama_anggota || user?.fullName || 'Member'

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ── Welcome Section ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-primary/20 p-6 sm:p-8 shadow-sm">
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Halo, <span className="text-primary">{displayName}</span>! 👋
            </h1>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <SparklesIcon className="size-4 text-secondary" />
              Kamu punya <span className="font-bold text-foreground">{stats.active} buku</span> yang sedang dipinjam.
            </p>
          </div>
          <Link href="/members/books" className="w-full sm:w-auto">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95">
              Jelajahi Katalog
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Left Column (8 units) */}
        <div className="space-y-8 lg:col-span-8">

          {/* Active Loans Card Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
                <BookOpenIcon className="size-5 text-primary" />
                Pinjaman Aktif
              </h2>
              <Link
                href="/members/loans"
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {loading ? (
                <div className="col-span-full h-32 rounded-2xl border-2 border-dashed border-muted bg-muted/20 animate-pulse" />
              ) : activeLoans.length === 0 ? (
                <div className="col-span-full rounded-2xl border-2 border-dashed border-muted bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                  Belum ada buku yang kamu pinjam.
                </div>
              ) : (
                activeLoans.map((loan) => (
                  // Ubah prop coverImage agar menggunakan buku pertama, dan tambahkan info multi-book di title
                  <ActiveLoanCard
                    key={loan.qr_token || loan.id_transaksi}
                    title={
                      loan.books.length > 1 
                        ? `${loan.books[0]?.judul_buku} (+${loan.books.length - 1} Buku)`
                        : (loan.books[0]?.judul_buku ?? 'Paket Buku')
                    }
                    dueDate={
                      loan.tgl_kembali_rencana
                        ? format(new Date(loan.tgl_kembali_rencana), 'dd MMM yyyy', { locale: localeID })
                        : '-'
                    }
                    progress={
                      loan.tgl_kembali_rencana && loan.tgl_pinjam
                        ? calculateProgress(loan.tgl_kembali_rencana, loan.tgl_pinjam)
                        : 0
                    }
                    isOverdue={
                      loan.tgl_kembali_rencana
                        ? isOverdue(loan.tgl_kembali_rencana)
                        : false
                    }
                    coverImage={loan.books[0]?.gambar_buku ?? undefined}
                  />
                ))
              )}
            </div>
          </section>

          {/* New Arrivals Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1 text-base font-bold text-foreground sm:text-lg">
               <ZapIcon className="size-5 text-secondary fill-secondary/20" />
               Baru Tersedia
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {recentBooks.map((book) => (
                <Card
                  key={book.id_buku}
                  className="group overflow-hidden border-2 border-muted bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
                    {book.gambar_buku ? (
                      <img
                        src={book.gambar_buku}
                        alt={book.judul_buku}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <BookOpenIcon className="size-8" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors" title={book.judul_buku}>
                      {book.judul_buku}
                    </h4>
                    <p className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                      {book.kategori?.nama_kategori ?? 'Kategori'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (4 units) */}
        <div className="space-y-6 lg:col-span-4">
          <div className="space-y-3">
            <h3 className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Kartu Anggota Digital
            </h3>
            <div className="mx-auto max-w-sm lg:mx-0 lg:max-w-none hover:scale-[1.01] transition-transform">
              <MemberCard
                name={displayName}
                nis={anggota?.nis ?? 'Belum ada NIS'}
                kelas={anggota?.kelas ?? 'Umum'}
              />
            </div>
          </div>

          <Card className="border-none bg-muted shadow-inner">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUpIcon className="size-4 text-secondary" />
                Ringkasan Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Selesai Dibaca</span>
                <span className="font-bold text-foreground">{stats.returned} Buku</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Terlambat</span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${stats.overdue > 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'}`}>
                  {stats.overdue} Buku
                </span>
              </div>
              <div className="flex items-center gap-2 border-t border-muted-foreground/20 pt-3 text-[10px] font-bold text-secondary">
                <div className="size-1.5 rounded-full bg-secondary animate-pulse" />
                STATUS: TERVERIFIKASI
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}