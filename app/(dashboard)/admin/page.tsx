"use client";

import { useState, useMemo } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import {
  DashboardSkeleton,
  DashboardError,
  DashboardStatsGrid,
  TrendChart,
  BookAvailabilityChart,
  TransaksiTable,
} from "@/components/dashboard";
import { normalizeTransaksi } from "@/components/dashboard/dashboard.utils";

export default function DashboardPage() {
  const [chartDays, setChartDays] = useState("7");

  const { dashboardStats: s, loading, error, refetch } = useDashboard(chartDays);

  // Normalize raw API transaksi → UI shape (memoized)
  const transaksi = useMemo(
    () => normalizeTransaksi(s?.recent_transactions ?? []),
    [s?.recent_transactions]
  );

  // ─── States ──────────────────────────────────────────────────────────────────

  if (error) return <DashboardError message={error} onRetry={refetch} />;
  if (loading && !s) return <DashboardSkeleton />;
  if (!s) return null;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan real-time sirkulasi perpustakaan hari ini.
        </p>
      </div>

      {/* Stat cards */}
      <DashboardStatsGrid stats={s} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TrendChart
          data={s.trend_data ?? []}
          days={chartDays}
          loading={loading}
          onDaysChange={setChartDays}
        />
        <BookAvailabilityChart stats={s} />
      </div>

      {/* Transactions table */}
      <TransaksiTable data={transaksi} />
    </div>
  );
}