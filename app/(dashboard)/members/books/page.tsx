'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image' // Optimasi gambar Next.js
import {
  SearchIcon,
  ShoppingBagIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  XIcon,
  InfoIcon,
  MinusIcon,
  PlusIcon,
  Loader2,
  StarIcon,
  MessageSquareIcon,
  ChevronDownIcon,
  TagsIcon,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface CategoryOption {
  id_kategori: number
  nama_kategori: string
}

interface CartItem extends BookItem {
  qty: number
}

export default function BrowseCatalogPage() {
  const { isLoaded } = useUser()

  // State Management
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // Mobile Optimization: Limit data yang di-render di DOM
  const [displayLimit, setDisplayLimit] = useState(10)

  // Fetch Data dari API
  const fetchBooks = useCallback(async (q: string, categoryId: number | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (categoryId) params.set('category', String(categoryId))
      const queryString = params.toString()
      const res = await fetch(`/api/member/catalog${queryString ? `?${queryString}` : ''}`)
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
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/member/categories')
        if (!res.ok) throw new Error('Gagal memuat kategori')
        const json = await res.json()
        setCategories(json.data ?? [])
      } catch {
        toast.error('Gagal memuat kategori buku')
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayLimit(10) // Reset limit saat filter berubah
      fetchBooks(search, selectedCategoryId)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, selectedCategoryId, fetchBooks])

  // Fetch reviews saat modal detail buku terbuka
  useEffect(() => {
    if (!selectedBook || !isModalOpen) {
      setReviews([])
      return
    }
    const fetchReviews = async () => {
      setReviewsLoading(true)
      try {
        const res = await fetch(`/api/member/reviews?buku_id=${selectedBook.id_buku}`)
        if (!res.ok) throw new Error('Gagal')
        const json = await res.json()
        setReviews(json.data ?? [])
      } catch {
        setReviews([])
      } finally {
        setReviewsLoading(false)
      }
    }
    fetchReviews()
  }, [selectedBook, isModalOpen])

  // Data yang benar-benar tampil (Virtualization Sederhana)
  const visibleBooks = books.slice(0, displayLimit)

  // Helper Functions
  const getQtyInCart = (id_buku: number) => cart.find(item => item.id_buku === id_buku)?.qty || 0

  const addToCart = (book: BookItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id_buku === book.id_buku)
      if (existing) {
        if (existing.qty >= book.stok_tersedia) {
          toast.error(`Stok maksimal! Sisa stok hanya ${book.stok_tersedia}.`)
          return prev
        }
        return prev.map(i => i.id_buku === book.id_buku ? { ...i, qty: i.qty + 1 } : i)
      }
      if (book.stok_tersedia <= 0) {
        toast.error('Stok buku ini habis.')
        return prev
      }
      toast.success(`"${book.judul_buku}" masuk keranjang`)
      return [...prev, { ...book, qty: 1 }]
    })
  }

  const decreaseQty = (id_buku: number) => {
    setCart(prev => prev.map(i => i.id_buku === id_buku ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))
  }

  const removeFromCart = (id_buku: number) => setCart(prev => prev.filter(i => i.id_buku !== id_buku))

  const totalItemsInCart = cart.reduce((sum, item) => sum + item.qty, 0)
  const selectedCategoryName = categories.find(category => category.id_kategori === selectedCategoryId)?.nama_kategori

  const handleCheckout = async () => {
    if (!isLoaded || cart.length === 0) return
    setIsCheckingOut(true)
    try {
      const flatBookIds = cart.flatMap(item => Array(item.qty).fill(item.id_buku))
      const res = await fetch('/api/member/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: flatBookIds }),
      })
      const json = await res.json()

      if (!res.ok) {
        // Denda aktif — member tidak boleh pinjam
        if (json.denda_aktif) {
          toast.error(json.error, { duration: 5000 })
          setIsCheckingOut(false)
          return
        }
        // Update UI ketika stok tidak mencukupi
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
      fetchBooks(search, selectedCategoryId)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 px-4 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Katalog Buku</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
            <BookOpenIcon className="size-4 text-primary" />
            Cari dan pinjam buku favoritmu.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Judul, pengarang..."
              className="pl-10 bg-white border-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border-2 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52"
                  aria-label="Filter kategori buku"
                />
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <TagsIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedCategoryName ?? 'Semua Kategori'}</span>
              </span>
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[60] max-h-72 w-56">
              <DropdownMenuItem
                onClick={() => setSelectedCategoryId(null)}
                className="cursor-pointer"
              >
                Semua Kategori
              </DropdownMenuItem>
              {categories.map(category => (
                <DropdownMenuItem
                  key={category.id_kategori}
                  onClick={() => setSelectedCategoryId(category.id_kategori)}
                  className="cursor-pointer"
                >
                  {category.nama_kategori}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid Buku */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {loading && books.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        ) : visibleBooks.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl">
            <BookOpenIcon className="mx-auto mb-3 size-10 text-muted" />
            <p className="text-muted-foreground font-medium">Buku tidak ditemukan.</p>
          </div>
        ) : (
          visibleBooks.map((book, index) => {
            const qtyInCart = getQtyInCart(book.id_buku)
            const isMaxedOut = qtyInCart >= book.stok_tersedia

            return (
              <Card key={book.id_buku} className="group flex flex-col overflow-hidden border-2 transition-all hover:border-primary/40">
                <div
                  className="relative aspect-[3/4] cursor-pointer bg-slate-100"
                  onClick={() => { setSelectedBook(book); setIsModalOpen(true) }}
                >
                  {book.gambar_buku ? (
                    <Image
                      src={book.gambar_buku}
                      alt={book.judul_buku}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover transition-transform group-hover:scale-105"
                      priority={index < 4} // Percepat gambar paling atas
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <BookOpenIcon className="size-10" />
                    </div>
                  )}
                  {qtyInCart > 0 && (
                    <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                      {qtyInCart} DI KERANJANG
                    </div>
                  )}
                </div>

                <CardContent className="p-3 flex-1">
                  <h3 className="line-clamp-2 text-[13px] font-bold leading-tight mb-1">{book.judul_buku}</h3>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate italic">
                    {book.pengarang || 'Anonim'}
                  </p>
                </CardContent>

                <CardFooter className="p-2 pt-0 gap-2">
                  <Button
                    variant={qtyInCart > 0 ? "secondary" : "default"}
                    size="sm"
                    className="w-full text-[11px] font-bold h-8"
                    onClick={() => addToCart(book)}
                    disabled={isMaxedOut}
                  >
                    {isMaxedOut ? 'HABIS' : qtyInCart > 0 ? '+ TAMBAH' : 'PINJAM'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Load More Button */}
      {!loading && books.length > displayLimit && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" className="rounded-full font-bold border-2" onClick={() => setDisplayLimit(prev => prev + 12)}>
            Lihat Lebih Banyak
          </Button>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      {totalItemsInCart > 0 && (
        <Button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 size-14 rounded-full shadow-2xl z-50 animate-in zoom-in"
        >
          <ShoppingBagIcon className="size-6" />
          <span className="absolute -top-1 -right-1 size-6 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
            {totalItemsInCart}
          </span>
        </Button>
      )}

      {/* Modal Detail */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-[460px] rounded-2xl p-0 overflow-hidden max-h-[85vh]">
          {selectedBook && (
            <div className="overflow-y-auto max-h-[85vh] custom-scrollbar">
              <div className="relative h-56 w-full bg-slate-50 flex-shrink-0">
                {selectedBook.gambar_buku ? (
                  <Image src={selectedBook.gambar_buku} alt={selectedBook.judul_buku} fill className="object-contain p-4" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-200"><BookOpenIcon className="size-16" /></div>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <DialogTitle className="text-lg font-bold leading-tight">{selectedBook.judul_buku}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{selectedBook.pengarang}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedBook.kategori?.nama_kategori || 'Katalog'}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
                    Sisa: {selectedBook.stok_tersedia - getQtyInCart(selectedBook.id_buku)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border italic">
                  {selectedBook.deskripsi_buku || 'Tidak ada deskripsi tersedia.'}
                </p>

                {/* Ulasan Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquareIcon className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-bold text-slate-700">
                      Ulasan {!reviewsLoading && `(${reviews.length})`}
                    </h4>
                  </div>

                  {reviewsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="space-y-2 p-3 bg-slate-50 rounded-xl border">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed">
                      <MessageSquareIcon className="size-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-xs text-slate-400 font-medium">Belum ada ulasan untuk buku ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                      {reviews.map((review: any) => {
                        const anggota = Array.isArray(review.anggota) ? review.anggota[0] : review.anggota
                        return (
                          <div key={review.id_ulasan} className="p-3 bg-slate-50 rounded-xl border space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 truncate">
                                {anggota?.nama_anggota || 'Anonim'}
                              </span>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`size-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.ulasan && (
                              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                                {review.ulasan}
                              </p>
                            )}
                            <p className="text-[9px] text-slate-300 font-medium">
                              {new Date(review.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Button
                  className="w-full font-bold h-11"
                  disabled={getQtyInCart(selectedBook.id_buku) >= selectedBook.stok_tersedia}
                  onClick={() => { addToCart(selectedBook); setIsModalOpen(false) }}
                >
                  Tambah Ke Keranjang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Keranjang */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[400px] rounded-2xl">
          <DialogHeader><DialogTitle className="font-bold">Keranjang Pinjaman</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto py-2">
            {cart.map(item => (
              <div key={item.id_buku} className="flex items-center gap-3 border p-2 rounded-xl">
                <div className="relative size-12 rounded overflow-hidden flex-shrink-0">
                  <Image src={item.gambar_buku || ''} alt={item.judul_buku} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{item.judul_buku}</p>
                  <p className="text-[10px] text-muted-foreground">Stok: {item.stok_tersedia}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => decreaseQty(item.id_buku)} className="size-6 bg-white rounded border flex items-center justify-center"><MinusIcon className="size-3" /></button>
                  <span className="text-xs font-bold w-3 text-center">{item.qty}</span>
                  <button onClick={() => addToCart(item)} disabled={item.qty >= item.stok_tersedia} className="size-6 bg-white rounded border flex items-center justify-center disabled:opacity-50"><PlusIcon className="size-3" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id_buku)} className="text-slate-400 hover:text-red-500 p-1"><XIcon className="size-4" /></button>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[10px] text-amber-800 font-medium">
            Ingat: Batas peminjaman maksimal adalah 7 hari sesuai aturan perpustakaan.
          </div>
          <Button
            className="w-full h-12 font-bold shadow-lg"
            onClick={handleCheckout}
            disabled={isCheckingOut || cart.length === 0}
          >
            {isCheckingOut ? <><Loader2 className="mr-2 animate-spin size-4" /> Memproses...</> : 'Konfirmasi Pinjaman'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
