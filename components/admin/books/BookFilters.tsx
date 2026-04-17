import { SearchIcon, FilterIcon, FileDownIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  searchQuery: string
  setSearchQuery: (val: string) => void
  onAddClick: () => void
}

export function BookFilters({ searchQuery, setSearchQuery, onAddClick }: Props) {
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
      <Button variant='outline' size='sm' disabled>
        <FilterIcon className='mr-2 size-4' /> Filter
      </Button>
    </div>
  )
}