# PerpuSmuhda — Sistem Perpustakaan Digital

Aplikasi manajemen perpustakaan digital berbasis QR Code.

## 🚀 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Auth**: Clerk (Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Package Manager**: pnpm

## ⚡ Quick Start

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local → isi nilai Clerk & Supabase
pnpm dev
```

## 🗄️ Setup Database
Jalankan `migration.sql` di Supabase SQL Editor.

## 🔗 Setup Clerk Webhook
- Endpoint: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

## 📋 Halaman Admin
- `/admin` — Dashboard statistik
- `/admin/books` — CRUD buku
- `/admin/categories` — CRUD kategori
- `/admin/members` — Manajemen anggota
- `/admin/transactions` — Semua transaksi
- `/admin/transactions/borrow` — Scan QR pinjam
- `/admin/transactions/return` — Scan QR kembali
- `/admin/transactions/overdue` — Daftar terlambat
- `/admin/fines` — Monitoring denda
- `/admin/reviews` — Moderasi ulasan
- `/admin/reports` — Laporan PDF
- `/admin/settings` — Pengaturan

## 📋 Halaman Member
- `/members` — Dashboard
- `/members/books` — Katalog & checkout
- `/members/loans` — Pinjaman aktif + QR
- `/members/history` — Riwayat + tulis ulasan
- `/members/my-reviews` — Ulasan saya
- `/members/feeds` — Review feeds
- `/members/profile` — Edit profil
- `/members/settings` — Pengaturan akun
