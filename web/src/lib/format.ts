export function formatPrice(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function discountPercent(price: number, originalPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
