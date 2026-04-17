import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/member/categories — daftar semua kategori untuk filter
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('kategori')
    .select('id_kategori, nama_kategori')
    .order('nama_kategori', { ascending: true })

  if (error) return NextResponse.json({ error: 'Gagal memuat kategori' }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}
