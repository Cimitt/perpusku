'use client'

import { useState } from 'react'

export function useQRTransaction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. SCAN QR (Fetch data dari API baru yang mendukung Bento)
  const scanQR = async (qrToken: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/qr?token=${qrToken}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membaca QR Code')
      }

      // API baru kita (GET /api/admin/qr) sudah mengembalikan format yang persis 
      // dibutuhkan oleh halaman ScanQRPage (termasuk array of books).
      // Jadi kita tinggal mengembalikan datanya langsung.
      return data

    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 2. APPROVE BORROW (Hit API POST action: 'approve_borrow')
  const approveBorrow = async (qrToken: string) => {
    const res = await fetch('/api/admin/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_borrow', qr_token: qrToken })
    })

    const json = await res.json()
    
    if (!res.ok) {
      throw new Error(json.error || 'Gagal menyetujui peminjaman & mengurangi stok.')
    }
    return true
  }

  // 3. PROCESS RETURN (Hit API POST action: 'process_return')
  const processReturn = async (qrToken: string) => {
    const res = await fetch('/api/admin/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'process_return', qr_token: qrToken })
    })

    const json = await res.json()

    if (!res.ok) {
      throw new Error(json.error || 'Gagal memproses pengembalian & memulihkan stok.')
    }
    
    // API mengembalikan { success: true, fine: 0 }
    return { fine: json.fine || 0 }
  }

  return { loading, error, scanQR, approveBorrow, processReturn, setError }
}