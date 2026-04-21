'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  BookOpen,
  QrCode,
  ShoppingCart,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Library,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const carouselSlides = [
  {
    id: 1,
    badge: 'Koleksi Baru 2026',
    title: 'Perluas Wawasanmu Hari Ini',
    desc: 'Temukan ratusan buku baru mulai dari fiksi, sains, hingga pengembangan diri di PerpuSmuhda.',
    bg: 'bg-primary text-primary-foreground',
    badgeColor: 'text-accent bg-background/20',
    img: 'https://images.unsplash.com/photo-1491309055486-24ae511c15c7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' 
  },
  {
    id: 2,
    badge: 'Mudah & Cepat',
    title: 'Pinjam Buku Tanpa Antre',
    desc: 'Gunakan fitur keranjang dan QR Code untuk pengalaman meminjam buku yang lebih modern.',
    bg: 'bg-foreground text-background',
    badgeColor: 'text-background bg-background/20 border-background/20',
    img: 'https://images.unsplash.com/photo-1682072155213-856c2ab9d629?q=80&w=1036&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' 
  },
  {
    id: 3,
    badge: 'Fasilitas Siswa',
    title: 'Akses Katalog Real-time',
    desc: 'Cek ketersediaan buku favoritmu langsung dari ponsel sebelum datang ke perpustakaan.',
    bg: 'bg-accent text-accent-foreground',
    badgeColor: 'text-accent-foreground bg-background/30 border-background/20',
    img: 'https://images.unsplash.com/photo-1614849963640-9cc74b2a826f?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' 
  }
]

const showcaseBooks = [
  // GANTI URL DI BAWAH INI DENGAN URL GAMBAR SAMPUL BUKU 1-6
  { id: 1, title: 'Bumi Manusia', author: 'Pramoedya A. Toer', cover: 'https://placehold.co/160x240/9333ea/ffffff?text=BM' },
  { id: 2, title: 'Sapiens', author: 'Yuval Noah Harari', cover: 'https://placehold.co/160x240/1e1b4b/ffffff?text=SP' },
  { id: 3, title: 'Filosofi Teras', author: 'Henry Manampiring', cover: 'https://placehold.co/160x240/db2777/ffffff?text=FT' },
  { id: 4, title: 'Atomic Habits', author: 'James Clear', cover: 'https://placehold.co/160x240/a855f7/ffffff?text=AH' },
  { id: 5, title: 'Laut Bercerita', author: 'Leila S. Chudori', cover: 'https://placehold.co/160x240/4c1d95/ffffff?text=LB' },
  { id: 6, title: 'Madilog', author: 'Tan Malaka', cover: 'https://placehold.co/160x240/c026d3/ffffff?text=MD' },
]

function Navbar() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = search.trim()
    const catalogPath = query ? `/members/books?q=${encodeURIComponent(query)}` : '/members/books'

    router.push(`/sign-in?redirect_url=${encodeURIComponent(catalogPath)}`)
  }

  return (
    <nav className='sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm shrink-0'>
            <Library className='size-5 text-primary-foreground' />
          </div>
          <span className='text-xl font-extrabold tracking-tight text-foreground'>PerpuSmuhda</span>
        </div>

        <form onSubmit={handleSearch} className='hidden md:flex flex-1 max-w-md mx-8'>
          <div className='relative w-full group'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Cari buku, penulis, atau ISBN...'
              className='w-full rounded-full border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10'
            />
          </div>
        </form>

        <div className='flex items-center gap-3'>
          <Button asChild variant='ghost' className='hidden sm:flex hover:text-primary hover:bg-primary/10'>
            <Link href='/sign-in'>Masuk</Link>
          </Button>
          <Button asChild variant='outline' className='flex md:hidden rounded-full px-4 font-bold'>
            <Link href='/sign-in?redirect_url=%2Fmembers%2Fbooks'>Cari Buku</Link>
          </Button>
          <Button asChild className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 shadow-md shadow-primary/20'>
            <Link href='/sign-up'>Daftar</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselSlides.length)
    }, 5000) // Ganti slide setiap 5 detik
    return () => clearInterval(timer)
  }, [])

  return (
    <section className='px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto'>
      <div className='relative w-full overflow-hidden rounded-[2rem] shadow-2xl'>
        {/* Slides */}
        <div 
          className='flex transition-transform duration-700 ease-in-out'
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {carouselSlides.map((slide, index) => (
            <div key={slide.id} className={`w-full shrink-0 flex flex-col md:flex-row min-h-[400px] md:min-h-[500px] ${slide.bg}`}>
              <div className='flex-1 p-8 md:p-16 flex flex-col justify-center'>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border w-fit mb-6 backdrop-blur-sm ${slide.badgeColor}`}>
                  <Sparkles className='size-4' />
                  <span className='text-xs font-semibold tracking-wide uppercase'>{slide.badge}</span>
                </div>
                <h1 className='text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4'>
                  {slide.title}
                </h1>
                <p className='text-lg md:text-xl max-w-lg mb-8 leading-relaxed opacity-90'>
                  {slide.desc}
                </p>
                <Button asChild size='lg' className='w-fit bg-background text-foreground hover:bg-muted rounded-full h-14 px-8 font-bold' >
                  <Link href='/sign-up'>Lihat Katalog <ArrowRight className='ml-2 size-5' /></Link>
                </Button>
              </div>
              <div className='hidden md:block md:w-2/5 relative'>
                <Image
                  src={slide.img}
                  alt={slide.title}
                  fill
                  sizes='(min-width: 768px) 40vw, 100vw'
                  {...(index === 0 ? { preload: true } : { loading: 'lazy' as const })}
                  className='object-cover'
                />
                {/* Overlay transisi warna gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.id === 1 ? 'from-primary' : slide.id === 2 ? 'from-foreground' : 'from-accent'} md:via-transparent to-transparent`} />
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10'>
          {carouselSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Tampilkan slide ${i + 1}: ${carouselSlides[i].title}`}
              aria-current={current === i ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                current === i ? 'w-8 bg-background' : 'w-2.5 bg-background/40 hover:bg-background/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: UserCheck, title: '1. Masuk / Daftar', desc: 'Login menggunakan akun Google untuk akses langsung ke katalog perpustakaan.' },
    { icon: BookOpen, title: '2. Cari Buku', desc: 'Gunakan fitur pencarian cerdas untuk menemukan buku pelajaran atau novel incaranmu.' },
    { icon: ShoppingCart, title: '3. Masukkan Keranjang', desc: 'Pilih beberapa buku sekaligus dan lakukan checkout keranjang secara digital.' },
    { icon: QrCode, title: '4. Scan QR Code', desc: 'Tunjukkan QR Code peminjaman ke petugas perpustakaan untuk membawa pulang buku.' },
  ]

  return (
    <section className='py-20 bg-muted/30'>
      <div className='max-w-7xl mx-auto px-4 md:px-8'>
        <div className='text-center max-w-2xl mx-auto mb-16'>
          <h2 className='text-3xl md:text-4xl font-black text-foreground mb-4'>Tata Cara Peminjaman</h2>
          <p className='text-lg text-muted-foreground'>Empat langkah mudah meminjam buku di PerpuSmuhda tanpa perlu antre panjang dan repot isi formulir kertas.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 relative'>
          {/* Connecting Line (Desktop Only) */}
          <div className='hidden md:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-border' />

          {steps.map((step, i) => (
            <div key={i} className='relative flex flex-col items-center text-center'>
              <div className='z-10 flex size-20 items-center justify-center rounded-2xl bg-background shadow-xl shadow-primary/5 border border-border mb-6 group hover:-translate-y-2 transition-transform duration-300'>
                <step.icon className='size-8 text-primary' />
              </div>
              <h3 className='text-xl font-bold text-foreground mb-2'>{step.title}</h3>
              <p className='text-sm text-muted-foreground leading-relaxed px-2'>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BooksCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBooks = (direction: 'previous' | 'next') => {
    scrollRef.current?.scrollBy({
      left: direction === 'next' ? 460 : -460,
      behavior: 'smooth',
    })
  }

  return (
    <section className='py-20'>
      <div className='max-w-7xl mx-auto px-4 md:px-8'>
        <div className='flex items-center justify-between mb-10'>
          <div>
            <h2 className='text-3xl font-black text-foreground'>Buku Terpopuler</h2>
            <p className='text-muted-foreground mt-2'>Paling sering dipinjam bulan ini</p>
          </div>
          <div className='hidden sm:flex gap-2'>
            <button
              type='button'
              onClick={() => scrollBooks('previous')}
              aria-label='Geser buku populer sebelumnya'
              className='w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted hover:text-primary transition-colors'
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type='button'
              onClick={() => scrollBooks('next')}
              aria-label='Geser buku populer berikutnya'
              className='w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted hover:text-primary transition-colors'
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll / Carousel Container */}
        <div ref={scrollRef} className='flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {showcaseBooks.map((book) => (
            <div key={book.id} className='snap-start shrink-0 w-[160px] md:w-[200px] group cursor-pointer'>
              <div className='relative mb-4 overflow-hidden rounded-xl shadow-md border border-border group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-300'>
                <Image
                  src={book.cover}
                  alt={book.title}
                  width={200}
                  height={300}
                  sizes='(max-width: 768px) 160px, 200px'
                  loading='lazy'
                  className='w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4'>
                  <Button asChild size='sm' className='w-full bg-primary hover:bg-primary/90 text-primary-foreground'>
                    <Link href='/sign-in?redirect_url=%2Fmembers%2Fbooks'>Pinjam</Link>
                  </Button>
                </div>
              </div>
              <h3 className='font-bold text-base text-foreground leading-snug mb-1 truncate'>{book.title}</h3>
              <p className='text-sm text-muted-foreground truncate'>{book.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABanner() {
  return (
    <section className='py-12 px-4 md:px-8 max-w-7xl mx-auto mb-12'>
      <div className='relative rounded-[2.5rem] overflow-hidden px-6 py-16 text-center shadow-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/20'>
        <div className='absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/30 blur-3xl pointer-events-none' />
        <div className='absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none' />
        
        <div className='relative z-10 max-w-2xl mx-auto'>
          <h2 className='text-3xl md:text-5xl font-black text-foreground leading-tight mb-6'>
            Tingkatkan Budaya Literasi Mulai Dari Genggaman.
          </h2>
          <p className='text-muted-foreground text-lg mb-10'>
            Bergabung dengan ratusan siswa lainnya. Daftar gratis sekarang dan nikmati kemudahan akses ke seluruh koleksi PerpuSmuhda.
          </p>
          <Button asChild size='lg' className='bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10 h-14 text-lg shadow-lg shadow-primary/30' >
            <Link href='/sign-up'>Buat Akun Sekarang</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className='border-t border-border bg-background'>
      <div className='max-w-7xl mx-auto px-4 py-8 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='flex items-center gap-2.5'>
          <div className='flex size-8 items-center justify-center rounded-lg bg-primary'>
            <Library className='size-4 text-primary-foreground' />
          </div>
          <span className='font-extrabold text-foreground'>PerpuSmuhda</span>
        </div>
        <p className='text-sm font-medium text-muted-foreground'>
          © {new Date().getFullYear()} SMK Muhammadiyah 2 Klaten Utara. @robe.m.2
        </p>
      </div>
    </footer>
  )
}

export default function LandingPageClient() {
  return (
    <div className='min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary'>
      <Navbar />
      <HeroCarousel />
      <HowItWorks />
      <BooksCarousel />
      <CTABanner />
      <Footer />
    </div>
  )
}
