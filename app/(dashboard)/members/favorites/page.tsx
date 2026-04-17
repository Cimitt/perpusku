'use client'

import { HeartIcon, BookOpenIcon, SearchIcon, SparklesIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Halaman placeholder — fitur wishlist membutuhkan tabel baru di DB
// (Lihat "Nice to Have" di project context: fitur wishlist/bookmark buku)

export default function FavoritesPage() {
  return (
    <div className='max-w-2xl space-y-6 animate-in fade-in duration-500'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
          <HeartIcon className='size-6 text-rose-500 fill-rose-500' />
          My Favorites
        </h1>
        <p className='text-sm text-muted-foreground'>
          Simpan buku favorit untuk referensi bacaan berikutnya.
        </p>
      </div>

      {/* Coming soon card */}
      <Card className='border-none shadow-sm overflow-hidden'>
        <div className='h-2 bg-gradient-to-r from-rose-400 to-pink-500' />
        <CardContent className='p-8 text-center space-y-4'>
          <div className='mx-auto size-16 rounded-2xl bg-rose-50 flex items-center justify-center'>
            <HeartIcon className='size-8 text-rose-400' />
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-center gap-2'>
              <h2 className='text-lg font-bold text-slate-800'>Fitur Segera Hadir</h2>
              <Badge className='bg-amber-50 text-amber-700 border-amber-100 gap-1'>
                <SparklesIcon className='size-3' /> Coming Soon
              </Badge>
            </div>
            <p className='text-sm text-slate-500 max-w-sm mx-auto leading-relaxed'>
              Fitur <strong>wishlist/bookmark buku</strong> sedang dalam pengembangan.
              Nantinya kamu bisa menyimpan buku yang ingin dibaca ke daftar favoritmu.
            </p>
          </div>

          <div className='pt-2 space-y-3'>
            <p className='text-xs text-slate-400 font-medium uppercase tracking-widest'>
              Yang bisa kamu lakukan sekarang
            </p>
            <div className='grid gap-3 sm:grid-cols-2 text-left'>
              {[
                {
                  icon: BookOpenIcon,
                  label: 'Jelajahi Katalog',
                  desc: 'Temukan buku dari koleksi lengkap perpustakaan.',
                  href: '/members/books',
                  color: 'bg-indigo-50 text-indigo-600',
                },
                {
                  icon: SearchIcon,
                  label: 'Lihat Review Feeds',
                  desc: 'Temukan rekomendasi dari sesama anggota.',
                  href: '/members/feeds',
                  color: 'bg-violet-50 text-violet-600',
                },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className='flex items-start gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors cursor-pointer'>
                    <div className={`rounded-lg p-2 ${item.color} shrink-0`}>
                      <item.icon className='size-4' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-slate-800'>{item.label}</p>
                      <p className='text-xs text-slate-500 mt-0.5'>{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
