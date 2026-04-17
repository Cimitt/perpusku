const DENDA_PER_HARI = Number(process.env.DENDA_PER_HARI) || 1000

export function hitungDenda(
  tglKembaliRencana: Date | string,
  tglSekarang: Date = new Date(),
): number {
  const rencana = new Date(tglKembaliRencana)
  const selisihMs = tglSekarang.getTime() - rencana.getTime()
  const selisihHari = Math.floor(selisihMs / (1000 * 60 * 60 * 24))
  return selisihHari > 0 ? selisihHari * DENDA_PER_HARI : 0
}

export function formatDenda(denda: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(denda)
}
