export function generateOrderNumber(seq: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `BX-${date}-${String(seq).padStart(4, '0')}`
}
