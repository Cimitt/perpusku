import { SignUp } from '@clerk/nextjs'
import AuthPageShell, { clerkAuthAppearance } from '@/components/auth/AuthPageShell'

export default function SignUpPage() {
  return (
    <AuthPageShell
      eyebrow="Daftar Untuk Melanjutkan"
      title="Mulai Perjalanan Membaca Anda"
      description="Buat akun untuk mencari buku, menyimpan favorit, dan memakai QR peminjaman."
      switchLabel="Sudah punya akun?"
      switchHref="/sign-in"
      switchText="Masuk"
    >
      <SignUp
        appearance={clerkAuthAppearance}
        fallbackRedirectUrl="/members"
        signInUrl="/sign-in"
      />
    </AuthPageShell>
  )
}
