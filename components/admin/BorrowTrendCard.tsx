'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, // <-- Diganti dari BarChart
  Line,      // <-- Diganti dari Bar
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function subtractDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

export function BorrowTrendCardSkeleton() {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5 space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-52 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

export function BorrowTrendCard() {
  const [data, setData] = useState<{ date: string; pinjam: number; kembali: number }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const days = 7
        const today = new Date()
        const startDate = subtractDays(today, days - 1)
        startDate.setHours(0, 0, 0, 0)

        const { data: trxData } = await supabase
          .from('transaksi')
          .select('tgl_pinjam, tgl_kembali_aktual')
          .gte('created_at', startDate.toISOString())

        const trend = Array.from({ length: days }, (_, i) => {
          const day = subtractDays(today, days - 1 - i)
          const dayStr = toDateString(day)
          const label = formatDay(dayStr)

          const pinjam = trxData?.filter(t => t.tgl_pinjam?.startsWith(dayStr)).length ?? 0
          const kembali = trxData?.filter(t => t.tgl_kembali_aktual?.startsWith(dayStr)).length ?? 0

          return { date: label, pinjam, kembali }
        })

        setData(trend)
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }

    fetchTrend()
  }, [supabase])

  if (loading) return <BorrowTrendCardSkeleton />

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Tren Peminjaman (7 Hari)</h3>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-indigo-500 inline-block" />
              Pinjam
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 inline-block" />
              Kembali
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={210}>
          {/* Diubah menjadi LineChart dan menghapus barSize/barGap */}
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              dy={10} // Memberi jarak sedikit antara garis X dan label tanggal
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            {/* Diubah menjadi Line dengan efek lengkung (monotone) */}
            <Line 
              type="monotone" 
              dataKey="pinjam" 
              name="Dipinjam" 
              stroke="#6366f1" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="kembali" 
              name="Dikembalikan" 
              stroke="#34d399" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}