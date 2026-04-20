import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isMemberRoute = createRouteMatcher(['/members(.*)'])

const ADMIN_ROLES = ['Admin', 'Petugas'] as const
type AdminRole = typeof ADMIN_ROLES[number]
type UserRole = AdminRole | 'Anggota'

function isAdminRole(role: string | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

interface ClerkSessionClaims {
  metadata?: { role?: UserRole }
}

const isApiRoute = createRouteMatcher(['/api(.*)'])
const STATE_CHANGING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE']

function csrfCheck(req: NextRequest): NextResponse | null {
  if (!isApiRoute(req) || !STATE_CHANGING_METHODS.includes(req.method)) return null
  if (req.nextUrl.pathname.startsWith('/api/webhooks')) return null

  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  if (origin) {
    try {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json(
          { error: 'Cross-origin request blocked' },
          { status: 403 },
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid origin header' },
        { status: 403 },
      )
    }
  }

  return null
}

const proxy = clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth()

  const csrfBlock = csrfCheck(req)
  if (csrfBlock) return csrfBlock

  if (isPublicRoute(req)) return NextResponse.next()

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  const role = (sessionClaims as ClerkSessionClaims | undefined)?.metadata?.role

  if (isAdminRoute(req)) {
    if (!isAdminRole(role)) {
      return NextResponse.redirect(new URL('/members', req.url))
    }
    return NextResponse.next()
  }

  if (isMemberRoute(req)) {
    if (isAdminRole(role)) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export default proxy

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
