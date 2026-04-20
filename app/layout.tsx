import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'PerpuSmuhda',
  description: 'Sistem Manajemen Perpustakaan Digital',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      {/* Tambahkan suppressHydrationWarning pada tag html */}
      <html 
        lang="id" 
        className="h-full antialiased"
        suppressHydrationWarning
      >
        {/* Tambahkan juga pada tag body */}
        <body 
          className="min-h-full bg-background text-foreground" 
          suppressHydrationWarning
        >
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}
