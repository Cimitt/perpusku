import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpenIcon, CheckCircleIcon, ClockIcon } from 'lucide-react'

interface Props {
  stats: { total: number; available: number; unavailable: number }
  loading: boolean
}

export function BookStatsCards({ stats, loading }: Props) {
  const items = [
    { label: 'Total Koleksi', value: stats.total, unit: 'Judul', icon: BookOpenIcon, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Tersedia', value: stats.available, unit: 'Buku', icon: CheckCircleIcon, bg: 'bg-green-50', color: 'text-green-600' },
    { label: 'Tidak Tersedia', value: stats.unavailable, unit: 'Buku', icon: ClockIcon, bg: 'bg-amber-50', color: 'text-amber-600' },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {items.map((s) => (
        <Card key={s.label} className='border-none shadow-sm bg-white'>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className={`p-2 ${s.bg} ${s.color} rounded-lg`}><s.icon className='size-5' /></div>
            <div>
              <p className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>{s.label}</p>
              {loading ? <Skeleton className='h-6 w-20 mt-1' /> : (
                <p className='text-xl font-bold'>{s.value} <span className='text-xs font-normal text-slate-400'>{s.unit}</span></p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}