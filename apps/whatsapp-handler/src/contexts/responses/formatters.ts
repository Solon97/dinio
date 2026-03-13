export function formatCurrencyFromCents(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function capitalizeFirst(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}
