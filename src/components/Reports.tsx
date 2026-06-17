import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/LanguageContext'
import { formatCurrency, formatDate, getStartOfWeek, getStartOfMonth, getLastMonthStart, getLastMonthEnd } from '@/lib/helpers'
import { Calendar, TrendingUp, BarChart3, Download, FileText } from 'lucide-react'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
type Period = 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'custom'

interface Transaction { id: string; type: string; category: string; amount: number; description: string; date: string }
interface Order { id: string; totalAmount: number; status: string; paymentMode: string; date: string; items: { quantity: number; price: number; menuItem: { name: string } }[] }
interface MenuItem { id: string; name: string; price: number; cost: number }
interface ReportsProps { transactions: Transaction[]; orders: Order[]; menuItems: MenuItem[]; currency: string }

export default function Reports({ transactions, orders, menuItems, currency }: ReportsProps) {
  const { t } = useLanguage()
  const [period, setPeriod] = useState<Period>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateRange = useMemo(() => {
    const now = new Date()
    switch (period) {
      case 'today': return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now }
      case 'week': return { start: getStartOfWeek(), end: now }
      case 'month': return { start: getStartOfMonth(), end: now }
      case 'lastMonth': return { start: getLastMonthStart(), end: getLastMonthEnd() }
      case 'year': return { start: new Date(now.getFullYear(), 0, 1), end: now }
      case 'custom': return { start: customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1), end: customEnd ? new Date(customEnd + 'T23:59:59') : now }
    }
  }, [period, customStart, customEnd])

  const filtered = useMemo(() => {
    const tx = transactions.filter(t => { const d = new Date(t.date); return d >= dateRange.start && d <= dateRange.end })
    const or = orders.filter(o => { const d = new Date(o.date); return d >= dateRange.start && d <= dateRange.end })
    return { transactions: tx, orders: or }
  }, [transactions, orders, dateRange])

  const stats = useMemo(() => {
    const income = filtered.transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const expense = filtered.transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const totalOrders = filtered.orders.length
    const avgOrder = totalOrders > 0 ? filtered.orders.reduce((s, o) => s + o.totalAmount, 0) / totalOrders : 0
    return { income, expense, profit: income - expense, totalOrders, avgOrder, profitMargin: income > 0 ? ((income - expense) / income * 100) : 0 }
  }, [filtered])

  const dailyData = useMemo(() => {
    const days: Record<string, { date: string; income: number; expense: number; revenue: number }> = {}
    const start = new Date(dateRange.start); const end = new Date(dateRange.end)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const step = Math.max(1, Math.ceil(diffDays / 15))
    for (let i = 0; i <= diffDays; i += step) { const d = new Date(start); d.setDate(d.getDate() + i); const key = d.toISOString().split('T')[0]; days[key] = { date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), income: 0, expense: 0, revenue: 0 } }
    filtered.transactions.forEach(tx => { const key = new Date(tx.date).toISOString().split('T')[0]; if (days[key]) { if (tx.type === 'income') days[key].income += tx.amount; else days[key].expense += tx.amount } })
    filtered.orders.forEach(o => { const key = new Date(o.date).toISOString().split('T')[0]; if (days[key]) { days[key].revenue += o.totalAmount } })
    return Object.values(days)
  }, [filtered, dateRange])

  const categoryData = useMemo(() => { const cats: Record<string, number> = {}; filtered.transactions.forEach(tx => { cats[tx.category] = (cats[tx.category] || 0) + tx.amount }); return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) }, [filtered])
  const paymentData = useMemo(() => { const modes: Record<string, number> = {}; filtered.orders.forEach(o => { modes[o.paymentMode] = (modes[o.paymentMode] || 0) + o.totalAmount }); return Object.entries(modes).map(([name, value]) => ({ name, value })) }, [filtered])
  const topItems = useMemo(() => {
    const sales: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {}
    filtered.orders.forEach(order => { order.items?.forEach(item => { const name = item.menuItem?.name || 'Unknown'; const mi = menuItems.find(m => m.name === name); if (!sales[name]) sales[name] = { name, qty: 0, revenue: 0, profit: 0 }; sales[name].qty += item.quantity; sales[name].revenue += item.price * item.quantity; sales[name].profit += (item.price - (mi?.cost || 0)) * item.quantity }) })
    return Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [filtered, menuItems])

  const handleExport = () => {
    const lines = [`${t('reports')} - ${period}`, `${t('date')}: ${formatDate(dateRange.start)} ${t('to')} ${formatDate(dateRange.end)}`, '', `${t('totalIncome')}: ${formatCurrency(stats.income, currency)}`, `${t('totalExpenses')}: ${formatCurrency(stats.expense, currency)}`, `${t('netProfit')}: ${formatCurrency(stats.profit, currency)}`, '', `${t('date')},${t('type')},${t('category')},${t('amount')}`, ...filtered.transactions.map(tx => `${formatDate(tx.date)},${tx.type},${tx.category},${tx.amount},"${tx.description || ''}"`)]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `report-${period}-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{t('reports')}</h2><Button onClick={handleExport} variant="outline" className="gap-2"><Download className="h-4 w-4" />{t('downloadReport')}</Button></div>
      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-4 items-end"><div className="flex flex-wrap gap-2">{(['today', 'week', 'month', 'lastMonth', 'year', 'custom'] as Period[]).map(p => <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)}>{p === 'today' ? t('today') : p === 'week' ? t('thisWeek') : p === 'month' ? t('thisMonth') : p === 'lastMonth' ? t('lastMonth') : p === 'year' ? t('thisYear') : t('customDate')}</Button>)}</div>{period === 'custom' && <div className="flex gap-2"><Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-auto" /><Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-auto" /></div>}</div></CardContent></Card>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"><Card className="p-3"><p className="text-xs text-muted-foreground">{t('totalIncome')}</p><p className="text-lg font-bold text-green-600">{formatCurrency(stats.income, currency)}</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('totalExpenses')}</p><p className="text-lg font-bold text-red-600">{formatCurrency(stats.expense, currency)}</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('netProfit')}</p><p className={`text-lg font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>{formatCurrency(stats.profit, currency)}</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('profitMargin')}</p><p className="text-lg font-bold">{stats.profitMargin.toFixed(1)}%</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('totalOrders')}</p><p className="text-lg font-bold">{stats.totalOrders}</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('avgOrderValue')}</p><p className="text-lg font-bold">{formatCurrency(stats.avgOrder, currency)}</p></Card></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />{t('income')} vs {t('expense')}</CardTitle></CardHeader><CardContent>{dailyData.some(d => d.income > 0 || d.expense > 0) ? <ResponsiveContainer width="100%" height={280}><BarChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value: number) => formatCurrency(value, currency)} /><Legend /><Bar dataKey="income" name={t('income')} fill="#10b981" radius={[3, 3, 0, 0]} /><Bar dataKey="expense" name={t('expense')} fill="#ef4444" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="flex items-center justify-center h-[280px] text-muted-foreground">{t('noData')}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />{t('revenue')} {t('trend')}</CardTitle></CardHeader><CardContent>{dailyData.some(d => d.revenue > 0) ? <ResponsiveContainer width="100%" height={280}><LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value: number) => formatCurrency(value, currency)} /><Legend /><Line type="monotone" dataKey="revenue" name={t('revenue')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer> : <div className="flex items-center justify-center h-[280px] text-muted-foreground">{t('noData')}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />{t('category')} {t('overview')}</CardTitle></CardHeader><CardContent>{categoryData.length > 0 ? <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value, currency)} /></PieChart></ResponsiveContainer> : <div className="flex items-center justify-center h-[280px] text-muted-foreground">{t('noData')}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />{t('payment')} {t('overview')}</CardTitle></CardHeader><CardContent>{paymentData.length > 0 ? <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={paymentData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{paymentData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value, currency)} /></PieChart></ResponsiveContainer> : <div className="flex items-center justify-center h-[280px] text-muted-foreground">{t('noData')}</div>}</CardContent></Card>
      </div>
      {topItems.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t('bestSelling')}</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/50"><th className="text-left p-3 font-medium">#</th><th className="text-left p-3 font-medium">{t('name')}</th><th className="text-right p-3 font-medium">{t('quantity')}</th><th className="text-right p-3 font-medium">{t('revenue')}</th><th className="text-right p-3 font-medium">{t('profit')}</th></tr></thead><tbody>{topItems.map((item, idx) => <tr key={item.name} className="border-b hover:bg-muted/30"><td className="p-3">{idx + 1}</td><td className="p-3 font-medium">{item.name}</td><td className="p-3 text-right">{item.qty}</td><td className="p-3 text-right">{formatCurrency(item.revenue, currency)}</td><td className={`p-3 text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(item.profit, currency)}</td></tr>)}</tbody></table></div></CardContent></Card>}
    </div>
  )
}