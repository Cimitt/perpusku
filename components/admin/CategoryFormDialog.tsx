'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { kategoriSchema, type KategoriFormData } from '@/lib/validations'
import type { Category } from '@/app/(dashboard)/admin/categories/page'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (nama: string, deskripsi: string | null) => Promise<void>
  category?: Category | null
  mode: 'create' | 'edit'
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  category,
  mode,
}: CategoryFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KategoriFormData>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: { nama_kategori: '', deskripsi: null },
  })

  useEffect(() => {
    if (open) {
      setServerError(null)
      if (mode === 'edit' && category) {
        reset({ nama_kategori: category.nama_kategori, deskripsi: category.deskripsi })
      } else {
        reset({ nama_kategori: '', deskripsi: null })
      }
    }
  }, [open, mode, category, reset])

  const handleFormSubmit = async (data: KategoriFormData) => {
    setLoading(true)
    setServerError(null)
    try {
      await onSubmit(data.nama_kategori, data.deskripsi ?? null)
      onOpenChange(false)
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tambah Kategori Baru' : 'Edit Kategori'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nama_kategori">
              Nama Kategori <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nama_kategori"
              placeholder="Contoh: Fiksi, Sains, Sejarah..."
              {...register('nama_kategori')}
            />
            {errors.nama_kategori && (
              <p className="text-xs text-red-500">{errors.nama_kategori.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              placeholder="Deskripsi singkat kategori (opsional)"
              rows={3}
              {...register('deskripsi')}
            />
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
