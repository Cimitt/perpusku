import type { TransaksiRaw, Transaksi, StatusTransaksi } from "@/types/dashboard";

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr || dateStr === "-" || dateStr === "") return "-";
  try {
    const [y, m, d] = dateStr.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function normalizeTransaksi(raw: TransaksiRaw[]): Transaksi[] {
  if (!raw) return [];

  return raw.map((r) => {
    const rawStatus = (r.status_transaksi ?? r.status ?? "pending").toLowerCase();

    return {
      id: r.id_transaksi ?? r.id ?? 0,
      anggota:
        typeof r.anggota === "object"
          ? r.anggota?.nama_anggota ?? "Unknown"
          : r.anggota ?? "Unknown",
      kelas:
        typeof r.anggota === "object"
          ? r.anggota?.kelas ?? "-"
          : r.kelas ?? "-",
      buku:
        typeof r.buku === "object"
          ? r.buku?.judul_buku ?? "-"
          : r.buku ?? "-",
      tgl_pinjam: r.tgl_pinjam ?? "-",
      tgl_kembali: r.tgl_kembali_rencana ?? r.tgl_kembali ?? "-",
      status: rawStatus as StatusTransaksi,
      denda: r.denda ?? 0,
    };
  });
}