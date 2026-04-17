'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  SearchIcon,
  ShoppingBagIcon,
  Trash2Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  XIcon,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

import type { BukuKatalog } from '@/types'

type BookItem = BukuKatalog

export default function BrowseCatalogPage() {
  const { isLoaded } = useUser()

  const [books, setBooks]                   = useState<BookItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [cart, setCart]                     = useState<BookItem[]>([])
  const [isCartOpen, setIsCartOpen]         = useState(false)
  const [isCheckingOut, setIsCheckingOut]   = useState(false)
  const [selectedBook, setSelectedBook]     = useState<BookItem | null>(null)
  const [isModalOpen, setIsModalOpen]       = useState(false)

  const fetchBooks = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q)}` : ''
      const res = await fetch(`/api/member/catalog${params}`)
      if (!res.ok) throw new Error('Gagal memuat katalog')
      const json = await res.json()
      setBooks(json.data ?? [])
    } catch (err) {
      toast.error('Gagal memuat katalog buku')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchBooks(search), 300)
    return () => clearTimeout(timer)
  }, [search, fetchBooks])

  function addToCart(book: BookItem) {
    if (book.stok_tersedia <= 0) { toast.error('Stok buku ini habis.'); return }
    if (cart.some(i => i.id_buku === book.id_buku)) { toast.warning('Sudah di keranjang.'); return }
    setCart(prev => [...prev, book])
    toast.success(`"${book.judul_buku}" masuk keranjang!`)
  }

  function removeFromCart(id_buku: number) {
    setCart(prev => prev.filter(i => i.id_buku !== id_buku))
  }

  function isInCart(id_buku: number) {
    return cart.some(i => i.id_buku === id_buku)
  }

  async function handleCheckout() {
    if (!isLoaded || cart.length === 0) return
    setIsCheckingOut(true)
    try {
      const res = await fetch('/api/member/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: cart.map(b => b.id_buku) }),
      })
      const json = await res.json()

      if (!res.ok) {
        if (json.stok_habis) {
          setBooks(prev => prev.map(b =>
            json.stok_habis.includes(b.id_buku) ? { ...b, stok_tersedia: 0 } : b
          ))
          setCart(prev => prev.filter(b => !json.stok_habis.includes(b.id_buku)))
        }
        throw new Error(json.error || 'Gagal checkout')
      }

      toast.success(json.message)
      setCart([])
      setIsCartOpen(false)
      fetchBooks(search)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Katalog Buku</h1>
        <p className="text-sm text-muted-foreground">Temukan buku yang ingin kamu pinjam.</p>
      </div>

      <div className="relative md:w-1/2">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input placeholder="Cari judul buku..." className="pl-10 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex flex-col gap-2">
                <Skeleton className="aspect-[3/4] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : books.length === 0
            ? (
              <div className="col-span-full py-20 text-center text-slate-400">
                <BookOpenIcon className="mx-auto mb-3 size-10 text-slate-200" />
                <p className="font-medium">Tidak ada buku yang ditemukan.</p>
              </div>
            )
            : books.map((book) => {
                const habis = book.stok_tersedia <= 0
                const inCart = isInCart(book.id_buku)
                return (
                  <Card key={book.id_buku} className="group flex flex-col overflow-hidden border-none shadow-sm ring-1 ring-slate-100">
                    <div
                      className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-slate-100"
                      onClick={() => { setSelectedBook(book); setIsModalOpen(true) }}
                    >
                      {book.gambar_buku
                        ? <img src={book.gambar_buku} alt={book.judul_buku} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        : <div className="flex h-full w-full items-center justify-center text-slate-200"><BookOpenIcon className="size-10" /></div>
                      }
                      {habis && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-red-600">Stok Habis</span>
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-white shadow">
                          <CheckCircle2Icon className="size-3.5" />
                        </div>
                      )}
                    </div>
                    <CardContent className="flex-1 p-3">
                      <h3 className="line-clamp-2 text-xs font-bold text-slate-900" title={book.judul_buku}>{book.judul_buku}</h3>
                      <p className="mt-0.5 line-clamp-1 text-[10px] italic text-slate-400">{book.pengarang ?? '-'}</p>
                    </CardContent>
                    <CardFooter className="gap-2 border-t bg-slate-50 p-2">
                      <Button size="sm" variant="secondary" className="flex-1 text-[10px]" onClick={() => { setSelectedBook(book); setIsModalOpen(true) }}>Detail</Button>
                      <Button size="sm" className="flex-1 text-[10px]" onClick={() => addToCart(book)} disabled={habis || inCart} variant={inCart ? 'outline' : 'default'}>
                        {habis ? 'Habis' : inCart ? 'Di Keranjang' : 'Pinjam'}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })
        }
      </div>

      {/* Floating cart button */}
      {cart.length > 0 && (
        <button type="button" onClick={() => setIsCartOpen(true)} aria-label="Buka keranjang"
          className="fixed bottom-8 right-8 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ShoppingBagIcon className="size-6" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold ring-2 ring-white">{cart.length}</span>
        </button>
      )}

      {/* Book Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="line-clamp-2 pr-6">{selectedBook.judul_buku}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedBook.gambar_buku && (
                  <img src={selectedBook.gambar_buku} alt={selectedBook.judul_buku} className="h-56 w-full rounded-lg border object-cover" />
                )}
                <p className="max-h-36 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  {selectedBook.deskripsi_buku ?? 'Tidak ada sinopsis tersedia.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedBook.kategori?.nama_kategori ?? 'Tanpa Kategori'}</Badge>
                  <Badge className={selectedBook.stok_tersedia > 0 ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50' : 'bg-red-50 text-red-700 hover:bg-red-50'}>
                    Stok: {selectedBook.stok_tersedia}
                  </Badge>
                  <Badge variant="outline" className="text-slate-500">{selectedBook.tahun_terbit ?? '-'}</Badge>
                </div>
                <Button className="w-full" disabled={selectedBook.stok_tersedia <= 0 || isInCart(selectedBook.id_buku)}
                  onClick={() => { addToCart(selectedBook); setIsModalOpen(false) }}>
                  {selectedBook.stok_tersedia <= 0 ? 'Stok Habis' : isInCart(selectedBook.id_buku) ? 'Sudah di Keranjang' : 'Tambah ke Keranjang'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Modal */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Keranjang Peminjaman</DialogTitle></DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {cart.map((book) => (
              <div key={book.id_buku} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                {book.gambar_buku
                  ? <img src={book.gambar_buku} alt={book.judul_buku} className="size-12 rounded border object-cover" />
                  : <div className="flex size-12 items-center justify-center rounded border bg-slate-100 text-slate-300"><BookOpenIcon className="size-5" /></div>
                }
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{book.judul_buku}</p>
                  <p className="truncate text-[10px] text-slate-400">{book.pengarang ?? '-'}</p>
                </div>
                <button type="button" onClick={() => removeFromCart(book.id_buku)} aria-label="Hapus"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Durasi pinjam: <strong className="text-slate-700">7 hari</strong>. Tunjukkan QR kepada petugas setelah konfirmasi.
          </div>
          <DialogFooter>
            <Button className="w-full gap-2" onClick={handleCheckout} disabled={isCheckingOut || cart.length === 0}>
              {isCheckingOut ? 'Memproses...' : <><CheckCircle2Icon className="size-4" /> Konfirmasi Pinjam {cart.length} Buku</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}