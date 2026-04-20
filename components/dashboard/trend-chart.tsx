"use client";

import { RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";
import { TREN_CHART_CONFIG } from "./dashboard.constants";
import type { TrendData } from "@/types/dashboard";

interface TrendChartProps {
  data: TrendData[];
  days: string;
  loading: boolean;
  onDaysChange: (val: string) => void;
}

export function TrendChart({ data, days, loading, onDaysChange }: TrendChartProps) {
  return (
    <Card className="lg:col-span-2 shadow-sm border-border relative overflow-hidden">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
          <div className="flex flex-col items-center gap-2">
            <RefreshCcw className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Memperbarui tren...
            </span>
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">
            Tren Peminjaman Harian
          </CardTitle>
          <Select value={days} onValueChange={(value) => value && onDaysChange(value)}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Pilih Rentang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Hari Terakhir</SelectItem>
              <SelectItem value="30">30 Hari Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        {data.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-1">
            {Object.entries(TREN_CHART_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: cfg.color as string }}
                />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground font-medium">
            Belum ada data tren sirkulasi untuk ditampilkan.
          </div>
        ) : (
          <ChartContainer config={TREN_CHART_CONFIG} className="h-[200px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDipinjam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-primary)"     stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)"     stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="colorKembali" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-secondary)"   stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-secondary)"   stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="colorTerlambat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-destructive)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0}   />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="tanggal"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                width={30}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="dipinjam"  stroke="var(--color-primary)"     strokeWidth={2} fillOpacity={1} fill="url(#colorDipinjam)"  />
              <Area type="monotone" dataKey="kembali"   stroke="var(--color-secondary)"   strokeWidth={2} fillOpacity={1} fill="url(#colorKembali)"   />
              <Area type="monotone" dataKey="terlambat" stroke="var(--color-destructive)" strokeWidth={2} fillOpacity={1} fill="url(#colorTerlambat)" />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
