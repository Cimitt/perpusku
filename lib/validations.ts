import { z } from 'zod'

export const bukuSchema = z.object({
  judul_buku: z.string().min(1, 'Judul wajib diisi').max(150),
  id_kategori: z.number().int().positive().nullable(),
  pengarang: z.string().max(100).nullable(),
  penerbit: z.string().max(100).nullable(),
  tahun_terbit: z.number().int().min(1000).max(9999).nullable(),
  isbn: z.string().max(20).nullable(),
  deskripsi_buku: z.string().nullable(),
  stok: z.number().int('Stok harus berupa bilangan bulat').min(0, 'Stok tidak boleh minus'),
})

export const kategoriSchema = z.object({
  nama_kategori: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  deskripsi: z.string().nullable(),
})

export const anggotaSchema = z.object({
  nis: z.string().max(20).nullable(),
  nama_anggota: z.string().min(1, 'Nama wajib diisi').max(50),
  email: z.string().email('Email tidak valid').nullable(),
  kelas: z.string().max(20).nullable(),
})

export const ulasanSchema = z.object({
  rating: z.number().int().min(1).max(5),
  ulasan: z.string().min(1, 'Ulasan tidak boleh kosong'),
})

export type BukuFormData = z.infer<typeof bukuSchema>
export type KategoriFormData = z.infer<typeof kategoriSchema>
export type AnggotaFormData = z.infer<typeof anggotaSchema>
export type UlasanFormData = z.infer<typeof ulasanSchema>
