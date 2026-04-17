import type { ChartConfig } from "@/components/ui/chart";
import type { StatusTransaksi } from "@/types/dashboard";

/**
 * Konfigurasi jumlah data per halaman untuk tabel transaksi
 */
export const PAGE_SIZE = 5;

/**
 * Pemetaan status transaksi ke label UI, variant Shadcn Badge, dan warna custom.
 */
export const STATUS_CONFIG: Record<
  StatusTransaksi,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  dipinjam: {
    label: "Dipinjam",
    variant: "outline",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  terlambat: {
    label: "Terlambat",
    variant: "outline",
    className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  },
  kembali: {
    label: "Kembali",
    variant: "outline",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  dibatalkan: {
    label: "Dibatalkan",
    variant: "outline",
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
};

/**
 * Konfigurasi warna untuk Trend Chart (Area/Line Chart)
 */
export const TREN_CHART_CONFIG: ChartConfig = {
  dipinjam: { label: "Dipinjam",     color: "hsl(var(--primary))"   },
  kembali:  { label: "Dikembalikan", color: "hsl(var(--chart-2))"   },
  terlambat:{ label: "Terlambat",    color: "hsl(var(--destructive))" },
};

/**
 * Konfigurasi warna untuk Book Availability Chart (Donut/Pie Chart)
 */
export const BOOK_CHART_CONFIG: ChartConfig = {
  tersedia: { label: "Tersedia", color: "hsl(var(--primary))" },
  dipinjam: { label: "Dipinjam", color: "hsl(var(--muted))"   },
};