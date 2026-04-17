'use client'

import { ClockIcon, AlertCircleIcon, BookOpenIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActiveLoanCardProps {
  title: string
  dueDate: string
  progress: number
  isOverdue: boolean
  coverImage?: string | null
}

export function ActiveLoanCard({
  title,
  dueDate,
  progress,
  isOverdue,
  coverImage,
}: ActiveLoanCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md',
        isOverdue
          ? 'border-red-200 bg-red-50/50'
          : 'border-slate-100 bg-white'
      )}
    >
      <div className="flex items-start gap-3">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="size-12 rounded-lg object-cover border border-slate-100 shrink-0"
          />
        ) : (
          <div className="size-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <BookOpenIcon className="size-5 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 line-clamp-2">{title}</p>
          <div className={cn('flex items-center gap-1 mt-1', isOverdue ? 'text-red-600' : 'text-slate-500')}>
            {isOverdue ? (
              <AlertCircleIcon className="size-3 shrink-0" />
            ) : (
              <ClockIcon className="size-3 shrink-0" />
            )}
            <span className="text-xs font-medium">
              {isOverdue ? 'Terlambat — ' : 'Tenggat: '}
              {dueDate}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Durasi peminjaman</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              isOverdue
                ? 'bg-red-500'
                : progress > 75
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
