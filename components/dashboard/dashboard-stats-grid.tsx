import { BookOpen, Users, RefreshCcw, AlertCircle } from "lucide-react";
import { StatCard } from "./stat-card";
import type { DashboardStats } from "@/types/dashboard";

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Buku"
        value={(stats.books?.total ?? 0).toLocaleString("id-ID")}
        sub={`${stats.books?.categories ?? 0} kategori tersedia`}
        iconBg="bg-primary/10"
        icon={<BookOpen className="h-5 w-5 text-primary" />}
      />
      <StatCard
        title="Total Anggota"
        value={(stats.members?.total_active ?? 0).toLocaleString("id-ID")}
        sub={`${stats.members?.total_inactive ?? 0} anggota pasif`}
        iconBg="bg-secondary/20"
        icon={<Users className="h-5 w-5 text-secondary-foreground" />}
      />
      <StatCard
        title="Transaksi Aktif"
        value={(stats.transactions?.active_loans ?? 0).toLocaleString("id-ID")}
        sub={`Dari ${(stats.transactions?.total ?? 0).toLocaleString("id-ID")} histori`}
        iconBg="bg-accent/80"
        icon={<RefreshCcw className="h-5 w-5 text-accent-foreground" />}
      />
      <StatCard
        title="Tunggakan Terlambat"
        value={(stats.transactions?.overdue ?? 0).toLocaleString("id-ID")}
        sub="Butuh tindakan segera"
        iconBg="bg-destructive/10"
        icon={<AlertCircle className="h-5 w-5 text-destructive" />}
      />
    </div>
  );
}