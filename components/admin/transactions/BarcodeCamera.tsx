'use client'

import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { CameraOffIcon, Loader2Icon } from 'lucide-react'

interface BarcodeCameraProps {
  onScanSuccess: (code: string) => void
  disabled?: boolean
}

export function BarcodeCamera({ onScanSuccess, disabled }: BarcodeCameraProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  const handleScan = (detectedCodes: any[]) => {
    // Abaikan jika sedang proses loading atau tidak ada data QR
    if (!isScanning || disabled || !detectedCodes || detectedCodes.length === 0) return
    
    // Ambil string dari QR code yang terdeteksi
    const resultText = detectedCodes[0].rawValue

    if (resultText) {
      setIsScanning(false)
      onScanSuccess(resultText) // Lempar ke function utama
      
      // Jeda 2.5 detik sebelum kamera bisa memindai QR baru
      setTimeout(() => setIsScanning(true), 2500)
    }
  }

  if (disabled) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Memproses QR Code...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border-2 border-primary/20 bg-black aspect-square max-h-80 mx-auto">
      {/* Scanner Polosan: Tanpa props 'components' agar terhindar dari error TypeError */}
      <Scanner
        onScan={handleScan}
        onError={(error: any) => {
          console.error('Scanner Error:', error)
          if (error?.name === 'NotAllowedError') {
            setHasPermission(false)
          }
        }}
      />
      
      {/* Layar peringatan jika izin kamera ditolak */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-4 text-center z-10">
          <CameraOffIcon className="size-10 mb-2 opacity-50" />
          <p className="text-sm font-semibold">Akses Kamera Ditolak</p>
        </div>
      )}
    </div>
  )
}