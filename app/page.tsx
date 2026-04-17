import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import LandingPageClient from '@/components/landing/LandingPage'

export default async function LandingPage() {
  const { userId } = await auth()

  // Auto-redirect jika sudah login
  if (userId) {
    const supabase = createAdminClient()
    
    // 1. Cek level pengguna langsung dari Supabase
    const { data } = await supabase
      .from('pengguna')
      .select('level')
      .eq('clerk_id', userId)
      .maybeSingle()

    // 2. Lempar ke halaman yang sesuai berdasarkan level di database
    if (data?.level === 'Admin' || data?.level === 'Petugas') {
      redirect('/admin')
    } else {
      redirect('/members')
    }
  }

  return <LandingPageClient />
}