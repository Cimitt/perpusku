import { ChevronDownIcon, FilterIcon, SearchIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Kategori } from '@/types'

interface Props {
  searchQuery: string
  setSearchQuery: (val: string) => void
  categories: Kategori[]
  selectedCategoryId: number | null
  setSelectedCategoryId: (val: number | null) => void
  loadingCategories?: boolean
}

export function BookFilters({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  loadingCategories = false,
}: Props) {
  const selectedCategory = categories.find(
    (category) => category.id_kategori === selectedCategoryId
  )
  const selectedCategoryName = selectedCategory?.nama_kategori ?? 'Semua Kategori'

  return (
    <div className='flex flex-col sm:flex-row items-center gap-4 border-b bg-white p-4'>
      <div className='relative flex-1 w-full'>
        <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
        <input
          placeholder='Cari judul, pengarang, atau ISBN...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all'
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={loadingCategories}
          render={
            <button
              type='button'
              className='inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-all hover:bg-slate-100 focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-56'
              aria-label='Filter kategori buku'
            />
          }
        >
          <span className='flex min-w-0 items-center gap-2'>
            <FilterIcon className='size-4 shrink-0 text-muted-foreground' />
            <span className='truncate'>
              {loadingCategories ? 'Memuat kategori...' : selectedCategoryName}
            </span>
          </span>
          <ChevronDownIcon className='size-4 shrink-0 text-muted-foreground' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='z-[60] max-h-72 w-56'>
          <DropdownMenuItem
            onClick={() => setSelectedCategoryId(null)}
            className='cursor-pointer'
          >
            Semua Kategori
          </DropdownMenuItem>
          {categories.length === 0 ? (
            <DropdownMenuItem disabled className='text-muted-foreground'>
              Belum ada kategori
            </DropdownMenuItem>
          ) : (
            categories.map((category) => (
              <DropdownMenuItem
                key={category.id_kategori}
                onClick={() => setSelectedCategoryId(category.id_kategori)}
                className='cursor-pointer'
              >
                {category.nama_kategori}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
