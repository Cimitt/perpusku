import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { BOOK_CHART_CONFIG } from "./dashboard.constants";
import type { DashboardStats } from "@/types/dashboard";

interface BookAvailabilityChartProps {
  stats: DashboardStats;
}

export function BookAvailabilityChart({ stats }: BookAvailabilityChartProps) {
  const total       = stats.books?.total ?? 0;
  const activeLoans = stats.transactions?.active_loans ?? 0;
  const tersedia    = Math.max(0, total - activeLoans);

  const data = [
    { name: "Tersedia", value: tersedia,    color: "var(--color-primary)"   },
    { name: "Dipinjam", value: activeLoans, color: "var(--color-secondary)" },
  ].filter((d) => d.value > 0);

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Ketersediaan Buku</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground font-medium">
            Belum ada data buku.
          </div>
        ) : (
          <>
            <ChartContainer config={BOOK_CHART_CONFIG} className="h-[160px] w-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  formatter={(value) => [`${value} Buku`, ""]}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {item.name} ({item.value.toLocaleString("id-ID")})
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}