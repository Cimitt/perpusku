'use client'

import { useState } from 'react'
import {
  SettingsIcon,
  SaveIcon,
  BanknoteIcon,
  CalendarIcon,
  ShieldIcon,
  InfoIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface SettingItem {
  key: string
  label: string
  description: string
  value: string
  type: 'number' | 'text'
  prefix?: string
  suffix?: string
}

const DEFAULT_SETTINGS: SettingItem[] = [
  {
    key: 'DENDA_PER_HARI',
    label: 'Denda per Hari',
    description: 'Biaya denda keterlambatan pengembalian buku per hari.',
    value: '1000',
    type: 'number',
    prefix: 'Rp',
    suffix: '/hari',
  },
  {
    key: 'MAKS_DURASI_PINJAM',
    label: 'Durasi Pinjam Maksimal',
    description: 'Lama maksimal peminjaman buku sebelum dihitung terlambat.',
    value: '7',
    type: 'number',
    suffix: 'hari',
  },
  {
    key: 'MAKS_PINJAMAN_AKTIF',
    label: 'Maks Buku Dipinjam Sekaligus',
    description: 'Jumlah buku maksimal yang bisa dipinjam oleh satu anggota bersamaan.',
    value: '5',
    type: 'number',
    suffix: 'buku',
  },
  {
    key: 'MAKS_PERPANJANGAN',
    label: 'Maks Perpanjangan',
    description: 'Jumlah maksimal perpanjangan yang diperbolehkan per transaksi.',
    value: '1',
    type: 'number',
    suffix: 'kali',
  },
]

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className='border-none shadow-sm'>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-2'>
          <div className='rounded-lg bg-indigo-50 p-2 text-indigo-600'>{icon}</div>
          <div>
            <CardTitle className='text-base'>{title}</CardTitle>
            <CardDescription className='text-xs mt-0.5'>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>{children}</CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(DEFAULT_SETTINGS.map(s => [s.key, s.value]))
  )
  const [saving, setSaving] = useState(false)

  function updateSetting(key: string, val: string) {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Pengaturan berhasil disimpan (simulasi — perlu integrasi .env)')
  }

  return (
    <div className='space-y-6 animate-in fade-in duration-500 max-w-3xl'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Pengaturan Sistem</h1>
          <p className='text-sm text-muted-foreground'>
            Konfigurasi parameter perpustakaan.
          </p>
        </div>
        <Button
          className='w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white'
          onClick={handleSave}
          disabled={saving}
        >
          <SaveIcon className='mr-2 size-4' />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>

      {/* Info banner */}
      <div className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800'>
        <InfoIcon className='size-4 shrink-0 mt-0.5' />
        <p>
          Pengaturan ini bersifat referensi. Nilai aktual dikonfigurasi via environment variable
          (<code className='text-xs bg-amber-100 px-1 rounded'>.env.local</code>) dan dibutuhkan
          restart server untuk berlaku.
        </p>
      </div>

      {/* Denda & Durasi */}
      <SettingCard
        icon={<BanknoteIcon className='size-4' />}
        title='Denda & Pembayaran'
        description='Aturan perhitungan denda keterlambatan.'
      >
        {DEFAULT_SETTINGS.slice(0, 2).map(s => (
          <div key={s.key} className='space-y-1.5'>
            <label className='text-sm font-medium text-slate-700'>
              {s.label}
            </label>
            <p className='text-xs text-slate-500'>{s.description}</p>
            <div className='flex items-center gap-2'>
              {s.prefix && (
                <span className='rounded-l-md border border-r-0 bg-slate-50 px-3 py-2 text-sm text-slate-500'>
                  {s.prefix}
                </span>
              )}
              <input
                type={s.type}
                value={settings[s.key]}
                onChange={e => updateSetting(s.key, e.target.value)}
                className={`flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 ${s.prefix ? 'rounded-l-none' : ''}`}
              />
              {s.suffix && (
                <span className='text-sm text-slate-400'>{s.suffix}</span>
              )}
            </div>
          </div>
        ))}
      </SettingCard>

      {/* Aturan Pinjaman */}
      <SettingCard
        icon={<CalendarIcon className='size-4' />}
        title='Aturan Pinjaman'
        description='Batas dan ketentuan peminjaman buku.'
      >
        {DEFAULT_SETTINGS.slice(2).map(s => (
          <div key={s.key} className='space-y-1.5'>
            <label className='text-sm font-medium text-slate-700'>
              {s.label}
            </label>
            <p className='text-xs text-slate-500'>{s.description}</p>
            <div className='flex items-center gap-2'>
              <input
                type={s.type}
                value={settings[s.key]}
                onChange={e => updateSetting(s.key, e.target.value)}
                className='flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
              />
              {s.suffix && (
                <span className='text-sm text-slate-400'>{s.suffix}</span>
              )}
            </div>
          </div>
        ))}
      </SettingCard>

      {/* System Info */}
      <SettingCard
        icon={<ShieldIcon className='size-4' />}
        title='Informasi Sistem'
        description='Detail konfigurasi sistem saat ini.'
      >
        <div className='grid gap-3 sm:grid-cols-2'>
          {[
            { label: 'Versi Aplikasi', value: 'v1.0.0' },
            { label: 'Framework', value: 'Next.js 16' },
            { label: 'Database', value: 'Supabase / PostgreSQL' },
            { label: 'Auth Provider', value: 'Clerk (Google OAuth)' },
            { label: 'Storage', value: 'Supabase Storage' },
            { label: 'QR System', value: 'jsonwebtoken + html5-qrcode' },
          ].map(item => (
            <div key={item.label} className='flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3'>
              <span className='text-xs text-slate-500'>{item.label}</span>
              <Badge variant='secondary' className='text-[10px]'>{item.value}</Badge>
            </div>
          ))}
        </div>
      </SettingCard>
    </div>
  )
}
