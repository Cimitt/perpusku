'use client'

import { useState, useEffect, useCallback } from 'react'
// Pastikan path ini benar-benar mengarah ke file dashboard.ts yang kita buat
import type { DashboardStats } from '@/types/dashboard'

export function useDashboard(days: string = '7') {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    // Jangan set loading true jika data sudah ada (untuk UX yang lebih smooth saat refetch)
    if (!dashboardStats) setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/dashboard?days=${days}`)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal memuat statistik')
      }
      
      const data: DashboardStats = await res.json()
      setDashboardStats(data)
    } catch (err: unknown) {
      console.error("Dashboard Fetch Error:", err)
      setError(err instanceof Error ? err.message : 'Gagal memuat statistik dashboard')
    } finally {
      setLoading(false)
    }
  }, [days, dashboardStats])

  // Efek untuk fetch data saat parameter 'days' berubah
  useEffect(() => { 
    fetchStats() 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]) 

  return { 
    dashboardStats, 
    loading, 
    error, 
    refetch: fetchStats 
  }
}