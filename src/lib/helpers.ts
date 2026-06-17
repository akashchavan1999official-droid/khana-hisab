export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
export function formatDate(date: Date | string, format: string = 'short'): string {
  const d = new Date(date)
  if (format === 'short') return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  if (format === 'long') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  return d.toLocaleDateString('en-IN')
}
export function getStartOfWeek(): Date {
  const now = new Date(); const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now); monday.setDate(diff); monday.setHours(0,0,0,0); return monday
}
export function getStartOfMonth(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1) }
export function getLastMonthStart(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth() - 1, 1) }
export function getLastMonthEnd(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) }
export function generateId(): string { return Math.random().toString(36).substring(2, 15) + Date.now().toString(36) }