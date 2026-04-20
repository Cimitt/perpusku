'use client'

import { useState } from 'react'
import { AlertCircleIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Kategori } from '@/types'

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  category: Kategori | null
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  onConfirm,
  category,
}: DeleteCategoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kategori')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Kategori</DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
            <AlertCircleIcon className="mt-0.5 size-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              Yakin ingin menghapus kategori{' '}
              <span className="font-semibold">&ldquo;{category?.nama_kategori}&rdquo;</span>?
              Semua buku dalam kategori ini akan kehilangan kategorinya.
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            disabled={loading}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Menghapus...' : 'Hapus Kategori'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
