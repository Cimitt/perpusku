import type { Metadata } from 'next'
import { SwaggerDocs } from './swagger-docs'

export const metadata: Metadata = {
  title: 'API Docs | PerpuSmuhda',
  description: 'Dokumentasi Swagger untuk API Supabase PerpuSmuhda',
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-950">PerpuSmuhda Supabase API</h1>
          <p className="text-sm text-slate-600">
            Swagger UI untuk endpoint Next.js yang terhubung ke Supabase. OpenAPI JSON tersedia di /api/docs.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-2 py-4">
        <SwaggerDocs />
      </div>
    </main>
  )
}
