'use client'

import { Loader2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { FeedPost } from '@/types'

interface FeedManageDialogProps {
  mode: 'edit' | 'delete' | null
  post: FeedPost | null
  editCaption: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onEditCaptionChange: (value: string) => void
  onConfirmEdit: () => void
  onConfirmDelete: () => void
}

export function FeedManageDialog({
  mode,
  post,
  editCaption,
  isSubmitting,
  onOpenChange,
  onEditCaptionChange,
  onConfirmEdit,
  onConfirmDelete,
}: FeedManageDialogProps) {
  const isOpen = !!mode && !!post

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {post && mode === 'edit' && (
        <DialogContent className="sm:max-w-md bg-white border-2 border-muted rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Edit Feed</DialogTitle>
            <DialogDescription>
              Ubah caption feed kamu di sini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border-2 border-muted bg-slate-50">
              {post.media_type === 'image' ? (
                <img
                  src={post.media_url ?? undefined}
                  alt="Preview feed"
                  className="h-48 w-full object-cover"
                />
              ) : (
                <video
                  src={post.media_url ?? undefined}
                  controls
                  muted
                  playsInline
                  className="h-48 w-full object-contain bg-black/5"
                />
              )}
            </div>

            <textarea
              value={editCaption}
              onChange={(e) => onEditCaptionChange(e.target.value)}
              disabled={isSubmitting}
              placeholder="Tulis ulang caption feed kamu..."
              className="w-full min-h-[140px] resize-none rounded-xl border-2 border-muted bg-slate-50 p-3 text-sm font-medium leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={onConfirmEdit} disabled={isSubmitting || !editCaption.trim()}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {post && mode === 'delete' && (
        <DialogContent className="sm:max-w-sm bg-white border-2 border-muted rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Hapus Feed?</DialogTitle>
            <DialogDescription>
              Feed ini beserta komentar dan likes akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-muted bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {post.caption}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              {isSubmitting ? 'Menghapus...' : 'Hapus Feed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
