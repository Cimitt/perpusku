'use client'
// komponen — dialog form tambah/edit buku
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImageIcon, UploadIcon, XIcon, Loader2Icon } from 'lucide-react'
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
import { toast } from 'sonner'
import { bukuSchema, type BukuFormData } from '@/lib/validations'
import type { BukuAdmin, Kategori } from '@/types'

// types
interface BookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  book?: BukuAdmin | null
  mode: 'create' | 'edit'
}

// cover upload
interface CoverUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

function CoverUpload({ value, onChange, disabled }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value)

  useEffect(() => {
    setPreview(value)
  }, [value])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5 MB')
      return
    }

    // Preview lokal dulu
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal upload cover')

      onChange(json.url)
      toast.success('Cover berhasil diupload')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal upload cover')
      setPreview(value)
      onChange(value)
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-1.5">
      <Label>Cover Buku</Label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative"
      >
        {preview ? (
          /* ── Preview gambar ── */
          <div className="relative w-full rounded-xl border border-border overflow-hidden bg-slate-50">
            <img
              src={preview}
              alt="Cover buku"
              className="mx-auto max-h-48 object-contain py-2"
            />
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 gap-2">
                <Loader2Icon className="size-5 animate-spin text-primary" />
                <span className="text-xs text-slate-500">Mengupload...</span>
              </div>
            )}
            {!uploading && !disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="Hapus cover"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        ) : (
          /* ── Drop zone ── */
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-slate-400 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2Icon className="size-6 animate-spin" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-slate-100">
                <ImageIcon className="size-5" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {uploading ? 'Mengupload...' : 'Klik atau drag & drop gambar'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">PNG, JPG, WebP — maks. 5 MB</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
              <UploadIcon className="size-3" />
              Pilih File
            </div>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
    </div>
  )
}

// main dialog
export function BookFormDialog({
  open,
  onOpenChange,
  onSuccess,
  book,
  mode,
}: BookFormDialogProps) {
  const [loading, setLoading]           = useState(false)
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [coverUrl, setCoverUrl]         = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BukuFormData>({
    resolver: zodResolver(bukuSchema),
    defaultValues: {
      judul_buku:     '',
      id_kategori:    null,
      pengarang:      null,
      penerbit:       null,
      tahun_terbit:   null,
      isbn:           null,
      deskripsi_buku: null,
      stok:           1,
    },
  })

  // Load kategori dari API route (tidak perlu auth untuk read)
  useEffect(() => {
    if (!open) return
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((j) => setKategoriList(j.data || []))
      .catch(console.error)
  }, [open])

  // Populate form saat edit
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && book) {
      reset({
        judul_buku:     book.judul_buku,
        id_kategori:    book.id_kategori,
        pengarang:      book.pengarang,
        penerbit:       book.penerbit,
        tahun_terbit:   book.tahun_terbit,
        isbn:           book.isbn,
        deskripsi_buku: book.deskripsi_buku,
        stok:           book.stok,
      })
      setCoverUrl(book.gambar_buku)
    } else {
      reset({
        judul_buku: '', id_kategori: null, pengarang: null,
        penerbit: null, tahun_terbit: null, isbn: null,
        deskripsi_buku: null, stok: 1,
      })
      setCoverUrl(null)
    }
  }, [open, mode, book, reset])

  const onSubmit = async (data: BukuFormData) => {
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        judul_buku:     data.judul_buku,
        id_kategori:    data.id_kategori,
        pengarang:      data.pengarang,
        penerbit:       data.penerbit,
        tahun_terbit:   data.tahun_terbit,
        isbn:           data.isbn,
        deskripsi_buku: data.deskripsi_buku,
        stok:           data.stok,
        gambar_buku:    coverUrl,
      }

      if (mode === 'create') {
        payload.stok_tersedia = data.stok
        const res = await fetch('/api/admin/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal menambah buku')
        toast.success('Buku berhasil ditambahkan')
      } else if (mode === 'edit' && book) {
        const res = await fetch(`/api/admin/books?id=${book.id_buku}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal memperbarui buku')
        toast.success('Buku berhasil diperbarui')
      }

      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tambah Buku Baru' : 'Edit Data Buku'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 disabled:opacity-75">
          {/* ── Layout: cover kiri, form kanan (pada layar lebih lebar) ── */}
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">

            {/* Cover Upload */}
            <div className="sm:row-span-3">
              <CoverUpload
                value={coverUrl}
                onChange={setCoverUrl}
                disabled={loading}
              />
            </div>

            {/* Judul */}
            <div className="space-y-1.5">
              <Label htmlFor="judul_buku">
                Judul Buku <span className="text-red-500">*</span>
              </Label>
              <Input
                id="judul_buku"
                placeholder="Masukkan judul buku"
                {...register('judul_buku')}
              />
              {errors.judul_buku && (
                <p className="text-xs text-red-500">{errors.judul_buku.message}</p>
              )}
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <Label htmlFor="id_kategori">Kategori</Label>
              <select
                id="id_kategori"
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                onChange={(e) => setValue('id_kategori', e.target.value ? Number(e.target.value) : null)}
                defaultValue={book?.id_kategori?.toString() ?? ''}
              >
                <option value="">-- Pilih Kategori --</option>
                {kategoriList.map((k) => (
                  <option key={k.id_kategori} value={k.id_kategori}>
                    {k.nama_kategori}
                  </option>
                ))}
              </select>
            </div>

            {/* Pengarang & Penerbit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pengarang">Pengarang</Label>
                <Input id="pengarang" placeholder="Nama pengarang" {...register('pengarang')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="penerbit">Penerbit</Label>
                <Input id="penerbit" placeholder="Nama penerbit" {...register('penerbit')} />
              </div>
            </div>
          </div>

          {/* Tahun & ISBN */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tahun_terbit">Tahun Terbit</Label>
              <Input
                id="tahun_terbit"
                type="number"
                placeholder="2024"
                {...register('tahun_terbit', { valueAsNumber: true })}
              />
              {errors.tahun_terbit && (
                <p className="text-xs text-red-500">{errors.tahun_terbit.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" placeholder="ISBN buku" {...register('isbn')} />
            </div>
          </div>

          {/* Stok */}
          <div className="space-y-1.5">
            <Label htmlFor="stok">Stok</Label>
            <Input
              id="stok"
              type="number"
              min={0}
              step={1}
              className="max-w-[120px]"
              {...register('stok', { valueAsNumber: true })}
            />
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">
                Stok tersedia akan dihitung otomatis dari stok total dikurangi buku yang sedang dipinjam.
              </p>
            )}
            {errors.stok && (
              <p className="text-xs text-red-500">{errors.stok.message}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="deskripsi_buku">Deskripsi</Label>
            <Textarea
              id="deskripsi_buku"
              placeholder="Deskripsi singkat tentang buku..."
              rows={3}
              {...register('deskripsi_buku')}
            />
          </div>
          </fieldset>

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
              {loading ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : mode === 'create' ? (
                'Tambah Buku'
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
