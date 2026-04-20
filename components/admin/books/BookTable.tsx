import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpenIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { BookRow } from './BookRow'
import type { BukuAdmin } from '@/types'

interface Props {
  books: BukuAdmin[]
  loading: boolean
  searchQuery: string
  hasActiveFilter?: boolean
  onEdit: (book: BukuAdmin) => void
  onDelete: (book: BukuAdmin) => void
}

export function BookTable({
  books,
  loading,
  searchQuery,
  hasActiveFilter = false,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Table className='min-w-[800px]'>
      <TableHeader className='bg-slate-50/50'>
        <TableRow>
          <TableHead className='pl-6'>Info Buku</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>ISBN</TableHead>
          <TableHead>Stok</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='text-right pr-6'>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={6} className="px-6"><Skeleton className='h-12 w-full' /></TableCell>
            </TableRow>
          ))
        ) : books.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className='text-center py-12 text-muted-foreground'>
              <div className='flex flex-col items-center gap-2'>
                <BookOpenIcon className='size-8 text-slate-300' />
                <p className='font-medium'>
                  {searchQuery || hasActiveFilter ? 'Tidak ada buku ditemukan' : 'Belum ada data buku'}
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          books.map((book) => (
            <BookRow key={book.id_buku} book={book} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </TableBody>
    </Table>
  )
}
