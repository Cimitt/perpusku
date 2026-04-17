import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Service-role client — ONLY use server-side (API routes, webhooks).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
