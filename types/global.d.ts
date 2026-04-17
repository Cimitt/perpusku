export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: 'Admin' | 'Petugas' | 'Anggota'
    }
  }
}