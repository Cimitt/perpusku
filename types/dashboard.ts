// ─── Enums ────────────────────────────────────────────────────────────────────

export type StatusTransaksi =
  | "pending"
  | "dipinjam"
  | "terlambat"
  | "kembali"
  | "dibatalkan";

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface TransaksiRaw {
  id_transaksi?: number;
  id?: number;
  anggota?: { nama_anggota: string; kelas: string } | string;
  kelas?: string;
  buku?: { judul_buku: string } | string;
  tgl_pinjam?: string;
  tgl_kembali_rencana?: string;
  tgl_kembali?: string;
  status_transaksi?: string;
  status?: string;
  denda?: number;
}

export interface TrendData {
  tanggal: string;
  dipinjam: number;
  kembali: number;
  terlambat: number;
}

export interface DashboardStats {
  books: {
    total: number;
    categories: number;
  };
  members: {
    total_active: number;
    total_inactive: number;
  };
  transactions: {
    total: number;
    active_loans: number;
    returned: number;
    overdue: number;
    pending: number;
  };
  fines: {
    total_accumulated: number;
    total_unpaid: number;
  };
  recent_transactions: TransaksiRaw[];
  trend_data: TrendData[];
}

// ─── Normalized / UI Shapes ───────────────────────────────────────────────────

export interface Transaksi {
  id: number;
  anggota: string;
  kelas: string;
  buku: string;
  tgl_pinjam: string;
  tgl_kembali: string;
  status: StatusTransaksi;
  denda: number;
}