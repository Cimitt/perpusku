import jwt from 'jsonwebtoken'
import type { QRPayload } from '@/types'

const QR_SECRET = process.env.QR_SECRET!

export function generateQRToken(
  payload: Omit<QRPayload, 'iat' | 'exp'>,
): string {
  return jwt.sign(payload, QR_SECRET, { expiresIn: '24h' })
}

export function verifyQRToken(token: string): QRPayload {
  return jwt.verify(token, QR_SECRET) as QRPayload
}
