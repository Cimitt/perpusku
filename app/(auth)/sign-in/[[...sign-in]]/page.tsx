import { SignIn } from '@clerk/nextjs'
import AuthPageShell, { clerkAuthAppearance } from '@/components/auth/AuthPageShell'

export default function SignInPage() {
  return (
    <AuthPageShell
      eyebrow="Log in untuk melanjutkan"
      title="Selamat Datang Kembali"
      description="Masuk untuk melihat katalog, riwayat pinjam, dan QR checkout buku."
      switchLabel="Belum punya akun?"
      switchHref="/sign-up"
      switchText="Daftar"
    >
      <SignIn
        appearance={clerkAuthAppearance}
        fallbackRedirectUrl="/members"
        signUpUrl="/sign-up"
      />
    </AuthPageShell>
  )
}
