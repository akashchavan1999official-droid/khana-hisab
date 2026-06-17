import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/LanguageContext'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { TrendingUp, TrendingDown, ShoppingCart, Receipt, Utensils, BarChart3 } from 'lucide-react'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface Transaction { id: string; type: string; category: string; amount: number; description: string; date: string }
interface Order { id: string; totalAmount: number; status: string; paymentMode: string; date: string; items: { quantity: number; price: number; menuItem: { name: string } }[] }
interface MenuItem { id: string; name: string; category: string; price: number; cost: number; isAvailable: boolean }
interface DashboardProps { transactions: Transaction[]; orders: Order[]; menuItems: MenuItem[]; currency: string; onNavigate?: (tab: string) => void }

export default function Dashboard({ transactions, orders, menuItems, currency, onNavigate }: DashboardProps) {
  const { t } = useLanguage()
  const stats = useMemo(() => {
    const now = new Date(); const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayTx = transactions.filter(tx => new Date(tx.date) >= todayStart)
    const monthTx = transactions.filter(tx => new Date(tx.date) >= monthStart)
    const todayOrders = orders.filter(o => new Date(o.date) >= todayStart)
    const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    return {
      todaySales: todayOrders.reduce((s, o) => s + o.totalAmount, 0),
      totalIncome, totalExpense,
      netProfit: totalIncome - totalExpense,
      todayOrders: todayOrders.length, totalOrders: orders.length,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0,
      monthIncome: monthTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
    }
  }, [transactions, orders])

  const dailyData = useMemo(() => {
    const days: Record<string, { date: string; income: number; expense: number }> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); days[key] = { date: key, income: 0, expense: 0 } }
    transactions.forEach(tx => { const key = new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); if (days[key]) { if (tx.type === 'income') days[key].income += tx.amount; else days[key].expense += tx.amount } })
    return Object.values(days)
  }, [transactions])

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {}
    transactions.filter(tx => tx.type === 'expense').forEach(tx => { cats[tx.category] = (cats[tx.category] || 0) + tx.amount })
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [transactions])

  const topSellingItems = useMemo(() => {
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    orders.forEach(order => { order.items?.forEach(item => { const name = item.menuItem?.name || 'Unknown'; if (!itemSales[name]) itemSales[name] = { name, quantity: 0, revenue: 0 }; itemSales[name].quantity += item.quantity; itemSales[name].revenue += item.price * item.quantity }) })
    return Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [orders])

  const recentTransactions = useMemo(() => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), [transactions])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">{t('dashboard')}</h2><p className="text-muted-foreground">{t('tagline')}</p></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-200"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t('todaySales')}</p><p className="text-2xl font-bold text-green-600">{formatCurrency(stats.todaySales, currency)}</p></div><ShoppingCart className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t('totalIncome')}</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalIncome, currency)}</p></div><TrendingUp className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-200"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t('totalExpenses')}</p><p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense, currency)}</p></div><Receipt className="h-8 w-8 text-red-500" /></div></CardContent></Card>
        <Card className={`bg-gradient-to-br ${stats.netProfit >= 0 ? 'from-emerald-500/10 to-emerald-500/5 border-emerald-200' : 'from-orange-500/10 to-orange-500/5 border-orange-200'}`}><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t('netProfit')}</p><p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>{formatCurrency(stats.netProfit, currency)}</p></div>{stats.netProfit >= 0 ? <TrendingUp className="h-8 w-8 text-emerald-500" /> : <TrendingDown className="h-8 w-8 text-orange-500" />}</div></CardContent></Card>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">{t('totalOrders')}</p><p className="text-lg font-bold">{stats.totalOrders}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">{t('avgOrderValue')}</p><p className="text-lg font-bold">{formatCurrency(stats.totalOrders > 0 ? stats.totalIncome / stats.totalOrders : 0, currency)}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">{t('profitMargin')}</p><p className="text-lg font-bold">{stats.profitMargin.toFixed(1)}%</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">{t('monthlyRevenue')}</p><p className="text-lg font-bold">{formatCurrency(stats.monthIncome, currency)}</p></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />{t('dailyBreakdown')}</CardTitle></CardHeader><CardContent>{dailyData.some(d => d.income > 0 || d.expense > 0) ? <ResponsiveContainer width="100%" height={250}><BarChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="income" name={t('income')} fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" name={t('expense')} fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="flex items-center justify-center h-[250px] text-muted-foreground">{t('noData')}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Utensils className="h-4 w-4" />{t('category')} - {t('expense')}</CardTitle></CardHeader><CardContent>{categoryData.length > 0 ? <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value, currency)} /></PieChart></ResponsiveContainer> : <div className="flex items-center justify-center h-[250px] text-muted-foreground">{t('noData')}</div>}</CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t('bestSelling')}</CardTitle></CardHeader><CardContent>{topSellingItems.length > 0 ? <div className="space-y-3">{topSellingItems.map((item, idx) => <div key={item.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-sm font-medium bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center text-xs">{idx + 1}</span><span className="text-sm">{item.name}</span></div><div className="text-right"><p className="text-sm font-semibold">{formatCurrency(item.revenue, currency)}</p><p className="text-xs text-muted-foreground">{item.quantity} {t('quantity')}</p></div></div>)}</div> : <div className="text-center text-muted-foreground py-8">{t('noData')}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t('recentTransactions')}</CardTitle></CardHeader><CardContent>{recentTransactions.length > 0 ? <div className="space-y-3">{recentTransactions.map(tx => <div key={tx.id} className="flex items-center justify-between"><div><p className="text-sm font-medium">{tx.description || tx.category}</p><p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p></div><Badge variant={tx.type === 'income' ? 'default' : 'destructive'} className="text-xs">{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}</Badge></div>)}</div> : <div className="text-center text-muted-foreground py-8">{t('noTransactions')}</div>}</CardContent></Card>
        <Card className="p-4"><div className="text-center text-sm text-muted-foreground space-y-1"><p className="font-medium">{t('appName')} v1.0</p><p>{t('tagline')}</p></div></Card>
      </div>
    </div>
  )
}