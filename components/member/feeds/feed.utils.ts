/**
 * Utility functions for the feeds feature.
 */

/** Format a date string into a human-readable relative time label (Indonesian). */
export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'BARU SAJA'
  if (diffInHours < 24) return `${diffInHours} JAM YANG LALU`
  return `${Math.floor(diffInHours / 24)} HARI YANG LALU`
}
