'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  SearchIcon,
  FolderIcon,
  MoreVerticalIcon,
  LayersIcon,
  EditIcon,
  TrashIcon,
  BookOpenIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog'
import { DeleteCategoryDialog } from '@/components/admin/DeleteCategoryDialog'

import type { Kategori } from '@/types'

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-indigo-500',
  'bg-emerald-500', 'bg-rose-500', 'bg-purple-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-orange-500',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Kategori | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categories')
      if (!res.ok) throw new Error('gagal mengambil data kategori')
      const json = await res.json()
      setCategories(json.data as Kategori[])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'gagal mengambil data kategori')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories
    return categories.filter((cat) =>
      cat.nama_kategori.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  const handleCreate = async (nama: string, deskripsi: string | null) => {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_kategori: nama.trim(), deskripsi }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'gagal membuat kategori')
    fetchCategories()
  }

  const handleEdit = async (nama: string, deskripsi: string | null) => {
    if (!selectedCategory) return
    const res = await fetch(`/api/admin/categories?id=${selectedCategory.id_kategori}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_kategori: nama.trim(), deskripsi }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'gagal mengubah kategori')
    fetchCategories()
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    const res = await fetch(`/api/admin/categories?id=${selectedCategory.id_kategori}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'gagal menghapus kategori')
    setCategories(prev => prev.filter(c => c.id_kategori !== selectedCategory.id_kategori))
    setIsDeleteModalOpen(false)
    setSelectedCategory(null)
  }

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Kategori Buku</h1>
          <p className='text-muted-foreground text-sm'>Kelola klasifikasi buku untuk mempermudah pencarian.</p>
        </div>
        <Button size='sm' className='bg-primary shadow-lg shadow-primary/20' onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon className='mr-2 size-4' /> Kategori Baru
        </Button>
      </div>

      <Card className='border-none shadow-sm shadow-slate-200/50 bg-white'>
        <CardContent className='p-4'>
          <div className='relative w-full max-w-md'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
            <input
              placeholder='Cari nama kategori...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400'
            />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className='border-none shadow-sm'>
              <CardContent className='p-5'>
                <div className='flex items-start justify-between mb-4'>
                  <Skeleton className='size-12 rounded-xl' />
                  <Skeleton className='size-8 rounded-full' />
                </div>
                <Skeleton className='h-5 w-24 mb-2' />
                <Skeleton className='h-4 w-32' />
                <div className='mt-4 pt-4 border-t'>
                  <Skeleton className='h-6 w-16' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && !loading && (
        <Card className='border-destructive bg-destructive/5'>
          <CardContent className='p-6 text-center'>
            <p className='text-destructive font-medium'>{error}</p>
            <Button variant='outline' size='sm' className='mt-4' onClick={fetchCategories}>Coba Lagi</Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filteredCategories.length === 0 && (
        <Card className='border-dashed shadow-none bg-slate-50/50'>
          <CardContent className='p-12 text-center'>
            <FolderIcon className='size-12 mx-auto mb-4 text-slate-300' />
            <h3 className='text-lg font-semibold mb-2 text-slate-700'>
              {searchQuery ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
            </h3>
            <p className='text-muted-foreground mb-4 max-w-sm mx-auto'>
              {searchQuery
                ? `tidak ada kategori yang cocok dengan pencarian "${searchQuery}"`
                : 'tambahkan kategori pertama untuk mengklasifikasikan buku di perpustakaan'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusIcon className='mr-2 size-4' /> Tambah Kategori
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && !error && filteredCategories.length > 0 && (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filteredCategories.map((category, index) => {
            const color = COLORS[index % COLORS.length]
            return (
              <Card key={category.id_kategori} className='border-none shadow-sm hover:shadow-md transition-all group'>
                <CardContent className='p-5'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className={`p-3 rounded-xl text-white ${color}`}>
                      <FolderIcon className='size-5' />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type='button'
                            className='inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            aria-label='opsi'
                          />
                        }
                      >
                        <MoreVerticalIcon className='size-4' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => { setSelectedCategory(category); setIsEditModalOpen(true) }} className='cursor-pointer'>
                          <EditIcon className='mr-2 size-4 text-slate-500' />
                          Edit Kategori
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { setSelectedCategory(category); setIsDeleteModalOpen(true) }}
                          className='cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700'
                        >
                          <TrashIcon className='mr-2 size-4 text-red-500' />
                          Hapus Kategori
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <h3 className='font-bold text-slate-900'>{category.nama_kategori}</h3>
                    <div className='flex items-center gap-2 mt-1'>
                      <BookOpenIcon className='size-3 text-slate-400' />
                      <span className='text-xs text-slate-500'>
                        Dibuat {new Date(category.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className='mt-4 pt-4 border-t border-slate-100 flex justify-between items-center'>
                    <Badge variant='secondary' className='font-mono text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-100'>
                      ID: {category.id_kategori}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && !error && filteredCategories.length > 0 && (
        <Card className='border-none shadow-sm bg-white'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between text-sm'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <LayersIcon className='size-4' />
                <span>
                  Menampilkan <strong className='text-foreground'>{filteredCategories.length}</strong>{' '}
                  dari <strong className='text-foreground'>{categories.length}</strong> kategori
                </span>
              </div>
              {searchQuery && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSearchQuery('')}
                  className='text-xs h-8 text-primary hover:bg-primary/10'
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <CategoryFormDialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onSubmit={handleCreate} mode='create' />
      <CategoryFormDialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen} onSubmit={handleEdit} category={selectedCategory} mode='edit' />
      <DeleteCategoryDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} onConfirm={handleDelete} category={selectedCategory} />
    </div>
  )
}
