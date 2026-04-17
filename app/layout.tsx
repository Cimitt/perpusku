import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

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
        className={`${geist.variable} h-full antialiased`} 
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