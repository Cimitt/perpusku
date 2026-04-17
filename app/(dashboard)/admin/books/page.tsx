'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PlusIcon, FileDownIcon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

// Komponen internal yang dipisah
import { BookStatsCards } from '@/components/admin/books/BookStatsCards'
import { BookFilters } from '@/components/admin/books/BookFilters'
import { BookTable } from '@/components/admin/books/BookTable'

// Komponen UI Global
import { BookFormDialog } from '@/components/admin/BookFormDialog'
import { DeleteBookDialog } from '@/components/admin/DeleteBookDialog'

// Types
import type { BukuAdmin } from '@/types'

interface BookStats {
  total: number
  available: number
  unavailable: number
}

export default function BooksPage() {
  // --- States ---
  const [books, setBooks] = useState<BukuAdmin[]>([])
  const [stats, setStats] = useState<BookStats>({ total: 0, available: 0, unavailable: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BukuAdmin | null>(null)

  // --- Logic: Fetch Stats ---
  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/admin/books')
      const json = await res.json()
      const list: BukuAdmin[] = json.data || []
      setStats({
        total: list.length,
        available: list.filter(b => b.status === 'tersedia').length,
        unavailable: list.filter(b => b.status === 'tidak').length,
      })
    } catch (err) {
      console.error('Gagal mengambil statistik:', err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // --- Logic: Fetch Books Data ---
  const fetchBooks = useCallback(async (query = '') => {
    setLoading(true)
    setError(null)
    try {
      const params = query.trim() ? `?q=${encodeURIComponent(query)}` : ''
      const res = await fetch(`/api/admin/books${params}`)
      if (!res.ok) throw new Error('Gagal mengambil data buku')
      
      const json = await res.json()
      const formatted: BukuAdmin[] = (json.data || []).map((b: any) => ({
        ...b,
        nama_kategori: b.kategori?.nama_kategori || 'tanpa kategori',
      }))
      
      setBooks(formatted)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }, [])

  // --- Effects ---
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const timer = setTimeout(() => fetchBooks(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchBooks])

  // Reset ke halaman 1 saat search berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // --- Kalkulasi Pagination ---
  const totalPages = Math.ceil(books.length / pageSize)
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return books.slice(start, start + pageSize)
  }, [books, currentPage, pageSize])

  // Fungsi untuk membuat array nomor halaman dengan ellipsis
  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Selalu tampilkan halaman 1
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      // Tampilkan halaman sekitar halaman aktif
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      // Selalu tampilkan halaman terakhir
      pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  // --- Handlers ---
  const handleSuccess = useCallback(() => {
    fetchBooks(searchQuery)
    fetchStats()
  }, [searchQuery, fetchBooks, fetchStats])

  const handleDelete = async () => {
    if (!selectedBook) return
    try {
      const res = await fetch(`/api/admin/books?id=${selectedBook.id_buku}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Gagal menghapus buku')
      }
      handleSuccess()
      setIsDeleteModalOpen(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      {/* Header Section */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Inventaris Buku</h1>
          <p className='text-muted-foreground text-sm'>
            Kelola koleksi buku, ketersediaan, dan informasi lengkap perpustakaan.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' disabled>
            <FileDownIcon className='mr-2 size-4 text-green-600' />
            Import Excel
          </Button>
          <Button
            size='sm'
            className='bg-primary shadow-lg shadow-primary/20'
            onClick={() => { 
              setSelectedBook(null)
              setIsAddModalOpen(true) 
            }}
          >
            <PlusIcon className='mr-2 size-4' />
            Tambah Buku
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive' className='bg-red-50 border-red-200'>
          <AlertCircleIcon className='size-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards Component */}
      <BookStatsCards stats={stats} loading={loadingStats} />

      {/* Main Content Card */}
      <Card className='border-none shadow-sm shadow-slate-200/50 overflow-hidden'>
        {/* Filters Component */}
        <BookFilters 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onAddClick={() => {
          setSelectedBook(null)
          setIsAddModalOpen(true)
        }}
      />

        {/* Table Component */}
        <CardContent className='p-0 bg-white overflow-x-auto'>
          <BookTable 
            books={paginatedBooks} 
            loading={loading} 
            searchQuery={searchQuery} 
            onEdit={(book) => {
              setSelectedBook(book)
              setIsEditModalOpen(true)
            }}
            onDelete={(book) => {
              setSelectedBook(book)
              setIsDeleteModalOpen(true)
            }}
          />
        </CardContent>

        {/* Pagination Controls */}
        {!loading && books.length > 0 && (
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t px-6 py-4 bg-slate-50/30'>
            {/* Info & Page Size */}
            <div className='flex items-center gap-3 text-sm text-slate-500'>
              <span>
                Menampilkan{' '}
                <span className='font-semibold text-slate-700'>
                  {Math.min((currentPage - 1) * pageSize + 1, books.length)}–{Math.min(currentPage * pageSize, books.length)}
                </span>{' '}
                dari <span className='font-semibold text-slate-700'>{books.length}</span> buku
              </span>
              <div className='hidden sm:flex items-center gap-2'>
                <span className='text-xs text-slate-400'>|</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className='h-8 w-[72px] text-xs bg-white'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align='end'>
                    {[5, 10, 20, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} / hal
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pagination Buttons */}
            <Pagination className='mx-0 w-auto'>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text='Sebelumnya'
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    aria-disabled={currentPage === 1}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page as number)}
                        className='cursor-pointer'
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    text='Selanjutnya'
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages || totalPages === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    aria-disabled={currentPage === totalPages || totalPages === 0}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Dialogs / Modals */}
      <BookFormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleSuccess}
        mode='create'
      />
      
      <BookFormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleSuccess}
        book={selectedBook}
        mode='edit'
      />
      
      <DeleteBookDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        book={selectedBook}
      />
    </div>
  )
}