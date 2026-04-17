'use client'

import Image from 'next/image'
import { MoreVerticalIcon, EditIcon, TrashIcon, BookOpenIcon } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { BukuAdmin } from '@/types'
import { Button } from '@/components/ui/button'

interface BookRowProps {
  book: BukuAdmin
  onEdit: (book: BukuAdmin) => void
  onDelete: (book: BukuAdmin) => void
}

export function BookRow({ book, onEdit, onDelete }: BookRowProps) {
  return (
    <TableRow className='hover:bg-slate-50/50 transition-colors group'>
      {/* Kolom Info Buku */}
      <TableCell className='pl-6'>
        <div className='flex items-center gap-3'>
          <div className='relative size-10 flex-shrink-0 overflow-hidden rounded border bg-slate-100'>
            {book.gambar_buku ? (
              <Image
                src={book.gambar_buku}
                alt={book.judul_buku}
                fill
                sizes="40px"
                className='object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center text-slate-400'>
                <BookOpenIcon className='size-4' />
              </div>
            )}
          </div>
          <div className='flex flex-col'>
            <span className='font-medium text-sm text-slate-900 line-clamp-1'>
              {book.judul_buku}
            </span>
            <span className='text-[10px] text-muted-foreground'>
              {book.pengarang ?? '-'} &bull; {book.tahun_terbit ?? '-'}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Kolom Kategori */}
      <TableCell>
        <Badge variant='secondary' className='text-[10px] font-normal'>
          {book.nama_kategori}
        </Badge>
      </TableCell>

      {/* Kolom ISBN */}
      <TableCell className='text-sm text-slate-600 font-mono'>
        {book.isbn ?? '-'}
      </TableCell>

      {/* Kolom Stok */}
      <TableCell className='text-sm text-slate-600'>
        {book.stok_tersedia}/{book.stok}
      </TableCell>

      {/* Kolom Status */}
      <TableCell>
        <Badge
          className={`text-[10px] font-medium shadow-none ${
            book.status === 'tersedia'
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
              : 'bg-red-50 text-red-700 hover:bg-red-50'
          }`}
        >
          {book.status === 'tersedia' ? 'Tersedia' : 'Tidak Tersedia'}
        </Badge>
      </TableCell>

      {/* Kolom Aksi (Dropdown) */}
<TableCell className='text-right pr-6'>
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <button
          className='inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-slate-100 transition-colors'
          aria-label='opsi buku'
        />
      }
    >
      <MoreVerticalIcon className='size-4' />
    </DropdownMenuTrigger>
    <DropdownMenuContent align='end' className="w-40">
      <DropdownMenuItem
        onClick={() => onEdit(book)}
        className='cursor-pointer'
      >
        <EditIcon className='mr-2 size-4 text-slate-500' />
        Edit Data
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onDelete(book)}
        className='cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50'
      >
        <TrashIcon className='mr-2 size-4 text-red-500' />
        Hapus Buku
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
    </TableRow>
  )
}