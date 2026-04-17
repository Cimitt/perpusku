// auto-generated via: npx supabase gen types typescript --local > types/supabase.ts
// regenerate setelah setiap perubahan skema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      pengguna: {
        Row: {
          id_pengguna: number
          clerk_id: string
          username: string | null
          email: string
          nama_pengguna: string | null
          level: 'Admin' | 'Petugas' | 'Anggota'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id_pengguna?: number
          clerk_id: string
          username?: string | null
          email: string
          nama_pengguna?: string | null
          level?: 'Admin' | 'Petugas' | 'Anggota'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pengguna']['Insert']>
      }
      anggota: {
        Row: {
          id_anggota: number
          id_pengguna: number
          nis: string | null
          nama_anggota: string
          email: string | null
          kelas: string | null
          foto: string | null
          username: string | null
          avatar_url: string | null
          clerk_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id_anggota?: number
          id_pengguna: number
          nis?: string | null
          nama_anggota: string
          email?: string | null
          kelas?: string | null
          foto?: string | null
          username?: string | null
          avatar_url?: string | null
          clerk_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['anggota']['Insert']>
      }
      kategori: {
        Row: {
          id_kategori: number
          nama_kategori: string
          deskripsi: string | null
          created_at: string
        }
        Insert: {
          id_kategori?: number
          nama_kategori: string
          deskripsi?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['kategori']['Insert']>
      }
      buku: {
        Row: {
          id_buku: number
          judul_buku: string
          id_kategori: number | null
          pengarang: string | null
          penerbit: string | null
          tahun_terbit: number | null
          isbn: string | null
          gambar_buku: string | null
          deskripsi_buku: string | null
          stok: number
          stok_tersedia: number
          status: 'tersedia' | 'tidak'
          created_at: string
          updated_at: string
        }
        Insert: {
          id_buku?: number
          judul_buku: string
          id_kategori?: number | null
          pengarang?: string | null
          penerbit?: string | null
          tahun_terbit?: number | null
          isbn?: string | null
          gambar_buku?: string | null
          deskripsi_buku?: string | null
          stok?: number
          stok_tersedia?: number
          status?: 'tersedia' | 'tidak'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['buku']['Insert']>
      }
      cart_items: {
        Row: {
          id_cart: number
          id_anggota: number
          id_buku: number
          created_at: string
        }
        Insert: {
          id_cart?: number
          id_anggota: number
          id_buku: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>
      }
      transaksi: {
        Row: {
          id_transaksi: number
          id_anggota: number
          id_buku: number
          tgl_pinjam: string | null
          tgl_kembali_rencana: string | null
          tgl_kembali_aktual: string | null
          status_transaksi: 'pending' | 'dipinjam' | 'dikembalikan' | 'terlambat' | 'dibatalkan'
          qr_token: string | null
          qr_action: string
          sudah_perpanjang: boolean
          tgl_perpanjangan: string | null
          denda: number
          denda_dibayar: boolean
          catatan: string | null
          jml_perpanjangan: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id_transaksi?: number
          id_anggota: number
          id_buku: number
          tgl_pinjam?: string | null
          tgl_kembali_rencana?: string | null
          tgl_kembali_aktual?: string | null
          status_transaksi?: 'pending' | 'dipinjam' | 'dikembalikan' | 'terlambat' | 'dibatalkan'
          qr_token?: string | null
          qr_action?: string
          sudah_perpanjang?: boolean
          tgl_perpanjangan?: string | null
          denda?: number
          denda_dibayar?: boolean
          catatan?: string | null
          jml_perpanjangan?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['transaksi']['Insert']>
      }
      ulasan_buku: {
        Row: {
          id_ulasan: number
          id_anggota: number
          id_buku: number
          rating: number
          ulasan: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id_ulasan?: number
          id_anggota: number
          id_buku: number
          rating: number
          ulasan?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ulasan_buku']['Insert']>
      }
      feeds: {
        Row: {
          id_feed: string
          id_anggota: number | null
          id_buku: number | null
          caption: string | null
          media_url: string
          media_type: 'image' | 'video' | null
          rating: number | null
          likes_count: number | null
          created_at: string | null
        }
        Insert: {
          id_feed?: string
          id_anggota?: number | null
          id_buku?: number | null
          caption?: string | null
          media_url: string
          media_type?: 'image' | 'video' | null
          rating?: number | null
          likes_count?: number | null
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['feeds']['Insert']>
      }
      feed_likes: {
        Row: {
          id_like: string
          id_feed: string | null
          id_anggota: number | null
        }
        Insert: {
          id_like?: string
          id_feed?: string | null
          id_anggota?: number | null
        }
        Update: Partial<Database['public']['Tables']['feed_likes']['Insert']>
      }
      feed_comments: {
        Row: {
          id_comment: string
          id_feed: string | null
          id_anggota: number | null
          comment_text: string
          created_at: string | null
        }
        Insert: {
          id_comment?: string
          id_feed?: string | null
          id_anggota?: number | null
          comment_text: string
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['feed_comments']['Insert']>
      }
    }
    Views: {
      v_statistik_dashboard: {
        Row: {
          total_anggota: number
          anggota_aktif: number
          total_buku: number
          total_stok: number
          buku_tersedia: number
          sedang_dipinjam: number
          transaksi_terlambat: number
          menunggu_konfirmasi: number
          total_denda_akumulasi: number
          total_denda_belum_bayar: number
          transaksi_hari_ini: number
        }
      }
      v_transaksi_aktif: {
        Row: {
          id_transaksi: number
          id_anggota: number
          nama_anggota: string
          nis: string | null
          kelas: string | null
          id_buku: number
          judul_buku: string
          nama_kategori: string | null
          tgl_pinjam: string | null
          tgl_kembali_rencana: string | null
          tgl_kembali_aktual: string | null
          status_transaksi: string
          denda: number
          denda_realtime: number
          denda_dibayar: boolean
          qr_token: string | null
          qr_action: string
          created_at: string
        }
      }
      v_denda_per_anggota: {
        Row: {
          id_anggota: number
          nama_anggota: string
          total_denda: number
          denda_belum_bayar: number
          jumlah_transaksi_denda: number
        }
      }
      v_katalog_buku: {
        Row: {
          id_buku: number
          judul_buku: string
          nama_kategori: string | null
          pengarang: string | null
          penerbit: string | null
          tahun_terbit: number | null
          gambar_buku: string | null
          deskripsi_buku: string | null
          stok: number
          stok_tersedia: number
          status: string
          rating_rata_rata: number | null
          jumlah_ulasan: number
        }
      }
    }
    Functions: {
      hitung_denda: {
        Args: { p_tgl_kembali_rencana: string; p_tgl_aktual?: string }
        Returns: number
      }
      perpanjang_transaksi: {
        Args: { p_id_transaksi: number }
        Returns: { success: boolean; message: string }
      }
      get_pengguna_id: {
        Args: Record<string, never>
        Returns: number
      }
      get_anggota_id: {
        Args: Record<string, never>
        Returns: number
      }
      is_admin_or_petugas: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_level_pengguna: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      level_pengguna: 'Admin' | 'Petugas' | 'Anggota'
      status_buku: 'tersedia' | 'tidak'
      status_transaksi: 'pending' | 'dipinjam' | 'dikembalikan' | 'terlambat' | 'dibatalkan'
    }
  }
}
