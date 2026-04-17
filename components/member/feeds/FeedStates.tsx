'use client'

import { Loader2Icon } from 'lucide-react'

export function FeedLoading() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
      <Loader2Icon className="size-10 animate-spin text-primary" />
      <p className="text-xs font-bold uppercase tracking-widest">Memuat Feed...</p>
    </div>
  )
}

export function FeedEmpty() {
  return (
    <div className="py-20 text-center text-muted-foreground">
      Belum ada review. Jadilah yang pertama!
    </div>
  )
}
