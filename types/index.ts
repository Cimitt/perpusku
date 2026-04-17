import type { Database } from './supabase'

// tabel row types

export type Pengguna    = Database['public']['Tables']['pengguna']['Row']
export type Anggota    = Database['public']['Tables']['anggota']['Row']
export type Kategori   = Database['public']['Tables']['kategori']['Row']
export type Buku       = Database['public']['Tables']['buku']['Row']
export type CartItem   = Database['public']['Tables']['cart_items']['Row']
export type Transaksi  = Database['public']['Tables']['transaksi']['Row']
export type UlasanBuku = Database['public']['Tables']['ulasan_buku']['Row']
export type Feed       = Database['public']['Tables']['feeds']['Row']
export type FeedLike   = Database['public']['Tables']['feed_likes']['Row']
export type FeedComment = Database['public']['Tables']['feed_comments']['Row']

// insert helpers

export type PenggunaInsert    = Database['public']['Tables']['pengguna']['Insert']
export type AnggotaInsert     = Database['public']['Tables']['anggota']['Insert']
export type BukuInsert        = Database['public']['Tables']['buku']['Insert']
export type KategoriInsert    = Database['public']['Tables']['kategori']['Insert']
export type TransaksiInsert   = Database['public']['Tables']['transaksi']['Insert']
export type UlasanBukuInsert  = Database['public']['Tables']['ulasan_buku']['Insert']
export type FeedInsert        = Database['public']['Tables']['feeds']['Insert']
export type CartItemInsert    = Database['public']['Tables']['cart_items']['Insert']

// update helpers

export type PenggunaUpdate   = Database['public']['Tables']['pengguna']['Update']
export type AnggotaUpdate    = Database['public']['Tables']['anggota']['Update']
export type BukuUpdate       = Database['public']['Tables']['buku']['Update']
export type KategoriUpdate   = Database['public']['Tables']['kategori']['Update']
export type TransaksiUpdate  = Database['public']['Tables']['transaksi']['Update']
export type UlasanBukuUpdate = Database['public']['Tables']['ulasan_buku']['Update']

// view types

export type VStatistikDashboard = Database['public']['Views']['v_statistik_dashboard']['Row']
export type VTransaksiAktif     = Database['public']['Views']['v_transaksi_aktif']['Row']
export type VDendaPerAnggota    = Database['public']['Views']['v_denda_per_anggota']['Row']
export type VKatalogBuku        = Database['public']['Views']['v_katalog_buku']['Row']

// enum types

export type StatusTransaksi = Database['public']['Enums']['status_transaksi']
export type StatusBuku      = Database['public']['Enums']['status_buku']
export type LevelPengguna   = Database['public']['Enums']['level_pengguna']

// auth dan role types

export const ADMIN_ROLES = ['Admin', 'Petugas'] as const
export type AdminRole = typeof ADMIN_ROLES[number]
export type UserRole  = LevelPengguna

export function isAdminRole(role: string | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

export interface ClerkUserMetadata {
  role: UserRole
}

export interface ClerkSessionClaims {
  metadata?: ClerkUserMetadata
  sub: string
}

// qr types

export type QRAction = 'pinjam' | 'kembali'

export interface QRPayload {
  id_transaksi: number
  id_anggota: number
  action: QRAction
  iat?: number
  exp?: number
}

// dashboard stats

export interface DashboardStats {
  members: {
    total_active: number
    total_inactive: number
  }
  books: {
    total: number
    available: number
    unavailable: number
    categories: number
  }
  transactions: {
    active_loans: number
    returned: number
    overdue: number
    pending: number
    total: number
  }
  fines: {
    total_accumulated: number
    total_unpaid: number
  }
}

// composite joined types

export interface BukuWithKategori extends Buku {
  nama_kategori?: string
  kategori?: Pick<Kategori, 'nama_kategori'> | null
}

export interface CartItemWithBuku extends CartItem {
  buku: Pick<Buku, 'id_buku' | 'judul_buku' | 'pengarang' | 'gambar_buku' | 'stok_tersedia' | 'status'>
}

export interface TransaksiWithBuku extends Transaksi {
  buku: Pick<Buku, 'id_buku' | 'judul_buku' | 'gambar_buku' | 'pengarang'> | null
}

export interface TransaksiWithDetail extends Transaksi {
  anggota: Pick<Anggota, 'id_anggota' | 'nama_anggota' | 'nis' | 'kelas'>
  buku: Pick<Buku, 'id_buku' | 'judul_buku' | 'gambar_buku'> | null
  denda_realtime?: number
}

export interface AnggotaWithPengguna extends Anggota {
  pengguna: Pick<Pengguna, 'email' | 'level' | 'is_active' | 'clerk_id'>
}

export interface UlasanWithRelasi extends UlasanBuku {
  anggota: Pick<Anggota, 'nama_anggota' | 'nis'> | null
  buku: Pick<Buku, 'judul_buku' | 'pengarang' | 'gambar_buku'> | null
}

export interface FeedWithRelasi extends Feed {
  is_liked?: boolean
  anggota: Pick<Anggota, 'id_anggota' | 'nama_anggota' | 'username' | 'avatar_url'> | null
  buku: Pick<Buku, 'judul_buku'> | null
  feed_comments?: FeedCommentWithAnggota[]
}

export interface FeedCommentWithAnggota extends FeedComment {
  anggota: Pick<Anggota, 'username' | 'avatar_url'> | null
}

export type FeedPost = FeedWithRelasi & {
  feed_comments: FeedCommentWithAnggota[]
}

// member types

export interface AnggotaData {
  id_anggota: number
  nama_anggota: string
  nis: string | null
  kelas: string | null
}

export interface ProfileData {
  email: string
  nama_pengguna: string | null
  level: LevelPengguna
  is_active: boolean
  anggota: {
    id_anggota: number
    nama_anggota: string
    nis: string | null
    kelas: string | null
    foto: string | null
    email: string | null
  } | null
}

export interface MemberRow {
  id_pengguna: number
  email: string
  nama_pengguna: string | null
  is_active: boolean
  created_at: string
  anggota: {
    id_anggota: number
    nis: string | null
    nama_anggota: string
    kelas: string | null
    foto: string | null
  } | null
}

// buku catalog types

export interface BukuKatalog {
  id_buku: number
  judul_buku: string
  pengarang: string | null
  gambar_buku: string | null
  deskripsi_buku: string | null
  tahun_terbit: number | null
  stok_tersedia: number
  status: StatusBuku
  kategori: Pick<Kategori, 'nama_kategori'> | null
}

export interface BukuAdmin extends BukuKatalog {
  isbn: string | null
  penerbit: string | null
  stok: number
  id_kategori: number | null
  created_at: string
  updated_at: string
  nama_kategori?: string
}

// transaksi grouped (paket pinjam) types

export interface PaketPinjam {
  qr_token: string
  ids: number[]
  status: StatusTransaksi
  tgl_pinjam: string | null
  tgl_kembali_rencana: string | null
  denda: number
  sudah_perpanjang: boolean
  jml_perpanjangan: number
  books: PaketBuku[]
}

export interface PaketBuku {
  id_transaksi: number
  id_buku: number
  judul_buku: string
  pengarang: string | null
  gambar_buku: string | null
  isbn?: string | null
}

// denda types

export interface DendaAnggota {
  id_anggota: number
  nama_anggota: string
  nis: string | null
  kelas: string | null
  email: string
  total_transaksi_denda: number
  total_denda: number
  denda_dibayar: number
  denda_belum_bayar: number
}

// overdue monitoring types

export interface OverdueRow {
  id_transaksi: number
  nama_anggota: string
  nis: string | null
  judul_buku: string
  tgl_kembali_rencana: string | null
  denda_realtime: number
}

// laporan types

export type ReportType = 'transactions' | 'fines' | 'books'

// api response wrapper

export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number
  page?: number
  limit?: number
}

// supabase rpc return types

export interface PerpanjangResult {
  success: boolean
  message: string
}

// member stats

export interface MemberStats {
  active: number
  returned: number
  overdue: number
}
