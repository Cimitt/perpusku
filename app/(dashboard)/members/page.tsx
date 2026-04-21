'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  BookOpenIcon,
  Clock3Icon,
  LibraryBigIcon,
  MoveRightIcon,
  SparklesIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  TrophyIcon,
  ZapIcon,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

import { ActiveLoanCard } from '@/components/member/ActiveLoanCard'
import { MemberCard } from '@/components/member/MemberCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

interface AnggotaData {
  id_anggota: number
  nama_anggota: string
  nis: string | null
  kelas: string | null
}

interface LoanBook {
  judul_buku?: string | null
  gambar_buku?: string | null
  kategori?: {
    nama_kategori?: string | null
  } | null
}

interface LoanRow {
  id_transaksi: number
  qr_token: string | null
  tgl_pinjam: string | null
  tgl_kembali_rencana: string | null
  status_transaksi: string
  buku: LoanBook | null
}

interface BookCatalogItem {
  id_buku: number
  judul_buku: string
  gambar_buku?: string | null
  kategori?: {
    nama_kategori?: string | null
  } | null
}

interface BentoLoan {
  id_transaksi: number
  qr_token: string | null
  tgl_pinjam: string | null
  tgl_kembali_rencana: string | null
  status: string
  books: LoanBook[]
}

interface Stats {
  active: number
  returned: number
  overdue: number
}

interface CategoryTrendPoint {
  month: string
  rawMonth: string
  [key: string]: string | number
}

interface CategorySeries {
  key: string
  label: string
  color: string
  total: number
}

const CATEGORY_COLORS = ['#2563eb', '#14b8a6', '#f97316', '#7c3aed'] as const

function calculateProgress(dueDateStr: string, borrowDateStr: string): number {
  const totalDays = differenceInDays(new Date(dueDateStr), new Date(borrowDateStr)) || 7
  const passedDays = differenceInDays(new Date(), new Date(borrowDateStr))
  return Math.min(Math.max((passedDays / totalDays) * 100, 0), 100)
}

function isOverdue(dueDateStr: string): boolean {
  return new Date(dueDateStr) < new Date()
}

function slugifyCategory(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function buildCategoryTrendData(rawLoans: LoanRow[]) {
  const baseDate = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - (5 - index), 1)
    return {
      rawMonth: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      month: date.toLocaleDateString('id-ID', { month: 'short' }),
    }
  })

  const categoryTotals = new Map<string, number>()
  const monthCategoryTotals = new Map<string, Map<string, number>>()

  for (const loan of rawLoans) {
    if (!loan.tgl_pinjam || !loan.buku) continue

    const date = new Date(loan.tgl_pinjam)
    if (Number.isNaN(date.getTime())) continue

    const rawMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!months.some((item) => item.rawMonth === rawMonth)) continue

    const category = loan.buku.kategori?.nama_kategori?.trim() || 'Tanpa Kategori'
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + 1)

    const monthMap = monthCategoryTotals.get(rawMonth) ?? new Map<string, number>()
    monthMap.set(category, (monthMap.get(category) ?? 0) + 1)
    monthCategoryTotals.set(rawMonth, monthMap)
  }

  const series: CategorySeries[] = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, total], index) => ({
      key: slugifyCategory(label) || `category-${index + 1}`,
      label,
      total,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))

  const data: CategoryTrendPoint[] = months.map((month) => {
    const item: CategoryTrendPoint = {
      month: month.month,
      rawMonth: month.rawMonth,
    }

    for (const category of series) {
      item[category.key] = monthCategoryTotals.get(month.rawMonth)?.get(category.label) ?? 0
    }

    return item
  })

  return { data, series }
}

function StatPanel({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  hint: string
  icon: React.ElementType
  tone?: 'default' | 'warning' | 'danger'
}) {
  return (
    <Card
      className={cn(
        'border-0 shadow-none ring-1',
        tone === 'warning' && 'bg-amber-50 ring-amber-200',
        tone === 'danger' && 'bg-rose-50 ring-rose-200',
        tone === 'default' && 'bg-white/85 ring-slate-200'
      )}
    >
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-2xl',
            tone === 'warning' && 'bg-amber-100 text-amber-700',
            tone === 'danger' && 'bg-rose-100 text-rose-700',
            tone === 'default' && 'bg-slate-100 text-slate-700'
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function MembersDashboardPage() {
  const { user, isLoaded } = useUser()
  const [anggota, setAnggota] = useState<AnggotaData | null>(null)
  const [activeLoans, setActiveLoans] = useState<BentoLoan[]>([])
  const [recentBooks, setRecentBooks] = useState<BookCatalogItem[]>([])
  const [stats, setStats] = useState<Stats>({ active: 0, returned: 0, overdue: 0 })
  const [categoryTrend, setCategoryTrend] = useState<CategoryTrendPoint[]>([])
  const [categorySeries, setCategorySeries] = useState<CategorySeries[]>([])
  const [loading, setLoading] = useState(true)

  const initDashboard = useCallback(async () => {
    if (!isLoaded || !user) return

    setLoading(true)

    try {
      const [meRes, loansRes, booksRes] = await Promise.all([
        fetch('/api/member/me'),
        fetch('/api/member/loans'),
        fetch('/api/member/catalog'),
      ])

      if (!meRes.ok || !loansRes.ok || !booksRes.ok) return

      const me = await meRes.json()
      const loansJson = await loansRes.json()
      const booksJson = await booksRes.json()

      if (me.id_anggota) {
        setAnggota({
          id_anggota: me.id_anggota,
          nama_anggota: me.nama_anggota,
          nis: me.nis,
          kelas: me.kelas,
        })
      }

      const rawLoans: LoanRow[] = loansJson.data ?? []
      const groups = rawLoans.reduce<Record<string, BentoLoan>>((acc, item) => {
        const token = item.qr_token || `temp-${item.id_transaksi}`

        if (!acc[token]) {
          acc[token] = {
            id_transaksi: item.id_transaksi,
            qr_token: item.qr_token,
            status: item.status_transaksi,
            tgl_pinjam: item.tgl_pinjam,
            tgl_kembali_rencana: item.tgl_kembali_rencana,
            books: [],
          }
        }

        if (item.buku) {
          acc[token].books.push(item.buku)
        }

        return acc
      }, {})

      const allBentoLoans = Object.values(groups)

      let activeCount = 0
      let returnedCount = 0
      let overdueCount = 0

      for (const group of allBentoLoans) {
        const bookCount = group.books.length
        if (group.status === 'dipinjam') activeCount += bookCount
        if (group.status === 'dikembalikan') returnedCount += bookCount
        if (group.status === 'terlambat') {
          activeCount += bookCount
          overdueCount += bookCount
        }
      }

      setStats({
        active: activeCount,
        returned: returnedCount,
        overdue: overdueCount,
      })

      setActiveLoans(
        allBentoLoans
          .filter((group) => group.status === 'dipinjam' || group.status === 'terlambat')
          .sort(
            (a, b) =>
              new Date(a.tgl_kembali_rencana ?? 0).getTime() -
              new Date(b.tgl_kembali_rencana ?? 0).getTime()
          )
          .slice(0, 3)
      )

      setRecentBooks((booksJson.data ?? []).slice(0, 4))

      const trend = buildCategoryTrendData(rawLoans)
      setCategoryTrend(trend.data)
      setCategorySeries(trend.series)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [isLoaded, user])

  useEffect(() => {
    initDashboard()
  }, [initDashboard])

  const displayName = anggota?.nama_anggota || user?.fullName || 'Member'

  const favoriteCategory = useMemo(() => {
    const sorted = [...categorySeries].sort((a, b) => b.total - a.total)
    return sorted[0]
  }, [categorySeries])

  const chartConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        categorySeries.map((series) => [
          series.key,
          {
            label: series.label,
            color: series.color,
          },
        ])
      ),
    [categorySeries]
  )

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_36%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_52%,_#eff6ff_100%)] p-6 shadow-sm sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.12),_transparent_62%)] lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 backdrop-blur">
              <SparklesIcon className="size-3.5 text-teal-600" />
              Dashboard Anggota
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Pantau ritme baca dan pinjamanmu dalam satu tempat.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Halo {displayName}. Kamu sedang memegang {stats.active} buku aktif, dengan fokus
                tertinggi di kategori {favoriteCategory?.label ?? 'yang paling sering kamu pinjam'}.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatPanel
                label="Sedang Dipinjam"
                value={`${stats.active}`}
                hint="Buku yang masih aktif."
                icon={LibraryBigIcon}
              />
              <StatPanel
                label="Selesai Dibaca"
                value={`${stats.returned}`}
                hint="Riwayat buku selesai."
                icon={TrophyIcon}
              />
              <StatPanel
                label="Perlu Perhatian"
                value={`${stats.overdue}`}
                hint="Pinjaman melewati batas."
                icon={TriangleAlertIcon}
                tone={stats.overdue > 0 ? 'danger' : 'warning'}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-2xl px-5">
                <Link href="/members/books">
                  Jelajahi Katalog
                  <MoveRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl px-5">
                <Link href="/members/loans">Lihat Semua Pinjaman</Link>
              </Button>
            </div>
          </div>

          <Card className="border border-white/70 bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <TrendingUpIcon className="size-4 text-teal-600" />
                Snapshot Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Kategori Teratas
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {favoriteCategory?.label ?? 'Belum ada data'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {favoriteCategory
                      ? `${favoriteCategory.total} peminjaman`
                      : 'Mulai pinjam buku untuk melihat tren.'}
                  </p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    Status Akun
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">Terverifikasi</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Siap meminjam dan mengelola riwayat.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tenggat Terdekat</p>
                    <p className="text-xs text-slate-500">Pinjaman yang perlu kamu perhatikan sekarang.</p>
                  </div>
                  <Clock3Icon className="size-4 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {activeLoans[0]?.tgl_kembali_rencana
                    ? format(new Date(activeLoans[0].tgl_kembali_rencana), 'dd MMMM yyyy', {
                        locale: localeID,
                      })
                    : 'Belum ada pinjaman aktif'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-950">
                  Tren Peminjaman per Kategori
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Enam bulan terakhir, diurutkan dari kategori yang paling sering kamu pinjam.
                </p>
              </div>
              {favoriteCategory && (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Puncak minat: {favoriteCategory.label}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[320px] animate-pulse rounded-3xl bg-slate-100" />
            ) : categorySeries.length === 0 ? (
              <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Belum ada data kategori untuk ditampilkan.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  {categorySeries.map((series) => (
                    <div
                      key={series.key}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: series.color }}
                        />
                        <span className="text-xs font-semibold text-slate-700">{series.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{series.total} peminjaman</p>
                    </div>
                  ))}
                </div>

                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <AreaChart data={categoryTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      {categorySeries.map((series) => (
                        <linearGradient
                          key={series.key}
                          id={`gradient-${series.key}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={series.color} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={series.color} stopOpacity={0.02} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {categorySeries.map((series) => (
                      <Area
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        stroke={series.color}
                        fill={`url(#gradient-${series.key})`}
                        strokeWidth={2.5}
                        fillOpacity={1}
                      />
                    ))}
                  </AreaChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="px-1 text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
              Kartu Anggota
            </h2>
            <div className="mx-auto max-w-sm xl:max-w-none">
              <MemberCard
                name={displayName}
                nis={anggota?.nis ?? 'Belum ada NIS'}
                kelas={anggota?.kelas ?? 'Umum'}
              />
            </div>
          </div>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-950">
                  Pinjaman Aktif
                </CardTitle>
                <Link
                  href="/members/loans"
                  className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Kelola
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
              ) : activeLoans.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Belum ada buku yang sedang kamu pinjam.
                </div>
              ) : (
                activeLoans.map((loan) => (
                  <ActiveLoanCard
                    key={loan.qr_token || loan.id_transaksi}
                    title={
                      loan.books.length > 1
                        ? `${loan.books[0]?.judul_buku} (+${loan.books.length - 1} buku)`
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
                      loan.tgl_kembali_rencana ? isOverdue(loan.tgl_kembali_rencana) : false
                    }
                    coverImage={loan.books[0]?.gambar_buku ?? undefined}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <ZapIcon className="size-4 text-amber-500" />
              Baru Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {recentBooks.map((book) => (
                <Link
                  key={book.id_buku}
                  href="/members/books"
                  className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white hover:shadow-lg hover:shadow-slate-200/70"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                    {book.gambar_buku ? (
                      <img
                        src={book.gambar_buku}
                        alt={book.judul_buku}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpenIcon className="size-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-bold text-slate-900">{book.judul_buku}</p>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                      {book.kategori?.nama_kategori ?? 'Kategori'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-[linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] text-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-white">Arah Aktivitas Baca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                Insight
              </p>
              <p className="mt-2 text-xl font-black">
                {favoriteCategory
                  ? `${favoriteCategory.label} jadi tema yang paling sering kamu ambil.`
                  : 'Mulai pinjam buku untuk membentuk pola bacamu.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-xs text-white/60">Pinjaman aktif</p>
                <p className="mt-2 text-3xl font-black">{stats.active}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-xs text-white/60">Kategori terlacak</p>
                <p className="mt-2 text-3xl font-black">{categorySeries.length}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              Jaga ritme pinjaman tetap sehat. Semakin konsisten pengembalianmu, semakin mudah membaca
              tren kategori yang benar-benar kamu minati.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
