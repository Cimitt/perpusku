import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Route matchers ────────────────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  '/',                        // landing page
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',        // Clerk webhook — tidak perlu auth
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isMemberRoute = createRouteMatcher(['/members(.*)'])

// ─── Role types ───────────────────────────────────────────────────────────────

const ADMIN_ROLES = ['Admin', 'Petugas'] as const
type AdminRole = typeof ADMIN_ROLES[number]
type UserRole = AdminRole | 'Anggota'

function isAdminRole(role: string | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

// Extend Clerk sessionClaims typing
interface ClerkSessionClaims {
  metadata?: { role?: UserRole }
}

// ─── CSRF helpers ─────────────────────────────────────────────────────────────

const isApiRoute = createRouteMatcher(['/api(.*)'])
const STATE_CHANGING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE']

/**
 * [FIX #11] Validate Origin header on mutating API requests to prevent CSRF.
 * Returns null if safe, or a NextResponse to block the request.
 */
function csrfCheck(req: NextRequest): NextResponse | null {
  // Only check state-changing methods on API routes
  if (!isApiRoute(req) || !STATE_CHANGING_METHODS.includes(req.method)) return null

  // Skip for webhooks (they use signature verification instead)
  if (req.nextUrl.pathname.startsWith('/api/webhooks')) return null

  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  // If origin is present, it must match the host
  if (origin) {
    try {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json(
          { error: 'Cross-origin request blocked' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid origin header' },
        { status: 403 }
      )
    }
  }

  return null
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth()

  // 0. [FIX #11] CSRF protection — validate Origin on state-changing API requests
  const csrfBlock = csrfCheck(req)
  if (csrfBlock) return csrfBlock

  // 1. Rute publik — lewatkan tanpa cek
  if (isPublicRoute(req)) return NextResponse.next()

  // 2. Belum login → redirect ke sign-in dengan return URL
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 3. Ambil role dari Clerk publicMetadata
  //    Role di-set saat webhook user.created:
  //    await clerkClient.users.updateUserMetadata(clerkId, {
  //      publicMetadata: { role: 'Anggota' }
  //    })
  const role = sessionClaims?.metadata?.role

  // 4. Guard admin routes — hanya Admin & Petugas
  if (isAdminRoute(req)) {
    if (!isAdminRole(role)) {
      return NextResponse.redirect(new URL('/members', req.url))
    }
    return NextResponse.next()
  }

  // 5. Guard member routes — Admin/Petugas langsung ke admin dashboard
  if (isMemberRoute(req)) {
    if (isAdminRole(role)) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}