/**
 * Security utilities for PerpuSmuhda
 * Provides input sanitization and HTML escaping functions.
 */

/**
 * Sanitize user input before interpolating into Supabase PostgREST filter strings.
 * Strips characters that could break out of .or() / .ilike() filters:
 *   , (column separator), % (wildcard — we add our own), ( ) (grouping), . (operator separator)
 *
 * @example
 *   sanitizePostgrestValue("test,email.eq.1")  → "testemailq1"
 */
export function sanitizePostgrestValue(val: string): string {
  // Remove PostgREST operators and special characters that could alter filter logic
  return val.replace(/[,%.()]/g, '')
}

/**
 * Escape HTML special characters to prevent XSS / HTML injection.
 * Suitable for embedding user input into HTML email templates.
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Validate that a request originates from the same origin (CSRF protection).
 * Returns true if the request is safe, false if it should be blocked.
 */
export function validateOrigin(request: Request, allowedOrigin?: string): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // If no origin/referer header, it might be a server-to-server call or same-origin navigation
  // Be permissive for GET/HEAD (safe methods)
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD') return true

  // For state-changing methods, require origin or referer
  if (!origin && !referer) return false

  if (allowedOrigin) {
    if (origin && origin !== allowedOrigin) return false
    if (!origin && referer && !referer.startsWith(allowedOrigin)) return false
  }

  return true
}
