import Link from 'next/link'
import type { ReactNode } from 'react'
import { BookOpen, Library, Music2, Play, Radio } from 'lucide-react'

type AuthPageShellProps = {
  eyebrow: string
  title: string
  description: string
  switchLabel: string
  switchHref: string
  switchText: string
  children: ReactNode
}

const benefits = [
  {
    icon: BookOpen,
    title: 'Catalog',
  },
  {
    icon: Radio,
    title: 'Borrow',
  },
  {
    icon: Play,
    title: 'Read',
  },
  {
    icon: Music2,
    title: 'Discuss',
  },
]

export const clerkAuthAppearance = {
  variables: {
    colorPrimary: 'oklch(0.68 0.16 12)',
    colorText: 'oklch(0.25 0.02 260)',
    colorTextSecondary: 'oklch(0.5 0.03 260)',
    colorBackground: 'oklch(1 0 0)',
    colorInputBackground: 'oklch(0.99 0.006 15)',
    colorInputText: 'oklch(0.25 0.02 260)',
    borderRadius: '8px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'w-full rounded-[8px] border-0 bg-transparent px-0 py-0 shadow-none',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'h-10 rounded-[8px] border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted',
    socialButtonsBlockButtonText: 'text-sm font-bold',
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground',
    formField: 'mb-3',
    formFieldLabel: 'mb-1.5 text-xs font-bold text-foreground',
    formFieldInput:
      'h-10 rounded-[6px] border-border bg-background text-sm text-foreground shadow-sm focus:border-primary focus:ring-primary/20',
    formButtonPrimary:
      'mt-1 h-10 rounded-[6px] bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90',
    footerActionText: 'text-muted-foreground',
    footerActionLink: 'font-bold text-primary hover:text-primary/80',
    identityPreviewText: 'text-foreground',
    identityPreviewEditButton: 'text-primary hover:text-primary/80',
    formFieldInputShowPasswordButton: 'text-muted-foreground hover:text-primary',
    formResendCodeLink: 'text-primary hover:text-primary/80',
    otpCodeFieldInput: 'rounded-[8px] border-border focus:border-primary focus:ring-primary/20',
  },
}

export default function AuthPageShell({
  eyebrow,
  title,
  description,
  switchLabel,
  switchHref,
  switchText,
  children,
}: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,oklch(0.99_0.005_0),oklch(0.97_0.01_15)_48%,oklch(0.88_0.08_185_/_0.34))] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-[8px] border border-primary/10 bg-card shadow-2xl shadow-primary/10 lg:min-h-[610px] lg:grid-cols-[1fr_1fr]">
          <section className="relative hidden overflow-hidden bg-primary lg:block">
            <div className="absolute inset-0 bg-[linear-gradient(130deg,oklch(0.68_0.16_12),oklch(0.8_0.11_18)_42%,oklch(0.88_0.08_185))]" />
            <div className="absolute inset-0 bg-[linear-gradient(38deg,oklch(1_0_0_/_0.28)_0%,transparent_34%),linear-gradient(148deg,transparent_8%,oklch(0.95_0.04_15_/_0.72)_48%,transparent_78%),linear-gradient(160deg,transparent_0%,oklch(0.3_0.05_200_/_0.46)_100%)]" />
            <div className="absolute inset-0 opacity-45 [background-image:repeating-linear-gradient(115deg,transparent_0,transparent_28px,oklch(1_0_0_/_0.08)_29px,transparent_31px)]" />

            <div className="relative z-10 flex h-full min-h-[610px] flex-col justify-between p-9 text-white xl:p-11">
              <Link href="/" className="flex w-fit items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-[8px] bg-white/14 text-white ring-1 ring-white/18 backdrop-blur">
                  <Library className="size-5" />
                </span>
                <span className="text-sm font-bold">PerpuSmuhda</span>
              </Link>

              <div className="max-w-sm">
                <p className="mb-3 text-xs font-bold text-white/76">Your library</p>
                <h1 className="text-4xl font-bold leading-[1.08] text-white xl:text-5xl">
                  Speed up your reading with our Web App
                </h1>
              </div>

              <div>
                <p className="mb-4 text-center text-xs font-bold text-white/58">Our powers</p>
                <div className="grid grid-cols-4 gap-3">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="flex items-center justify-center gap-1.5 text-xs font-bold text-white/82">
                      <benefit.icon className="size-4" />
                      <span>{benefit.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-5 py-8 sm:px-8 lg:min-h-0 lg:px-14 xl:px-16">
            <div className="w-full max-w-[360px]">
              <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
                <Link href="/" className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-sm shadow-primary/25">
                    <Library className="size-5" />
                  </span>
                  <span className="text-xl font-black">PerpuSmuhda</span>
                </Link>
                <Link
                  href={switchHref}
                  className="rounded-[8px] border border-primary/20 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
                >
                  {switchText}
                </Link>
              </div>

              <div className="mb-5 text-center sm:text-left">
                <p className="text-xs font-bold text-muted-foreground">{eyebrow}</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground">{title}</h1>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>

              {children}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {switchLabel}{' '}
                <Link href={switchHref} className="font-bold text-primary hover:text-primary/80">
                  {switchText}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
