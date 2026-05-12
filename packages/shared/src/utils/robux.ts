export function calcRobuxGross(robuxNet: number): number {
  // Buyer set gamepass harga ini agar after 30% tax, seller terima robuxNet
  return Math.ceil(robuxNet / 0.7)
}

export function calcPrice(robuxNet: number, ratePerRobux: number): number {
  return robuxNet * ratePerRobux
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatRobux(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}
