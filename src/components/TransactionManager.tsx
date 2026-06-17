import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/LanguageContext'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Plus, Search, TrendingUp, TrendingDown, Trash2, Receipt } from 'lucide-react'

interface Transaction { id: string; type: string; category: string; amount: number; description: string; date: string }
interface TransactionManagerProps { transactions: Transaction[]; currency: string; onAdd: (tx: Omit<Transaction, 'id'>) => void; onDelete: (id: string) => void }

const categories = { income: ['Food Sales', 'Beverage Sales', 'Catering', 'Other Income'], expense: ['Ingredients', 'Salary', 'Rent', 'Utilities', 'Maintenance', 'Packaging', 'Transport', 'Other'] }
const catHi: Record<string, string> = { 'Food Sales': 'खाना बिक्री', 'Beverage Sales': 'पेय बिक्री', 'Catering': 'केटरिंग', 'Other Income': 'अन्य आय', 'Ingredients': 'सामग्री', 'Salary': 'वेतन', 'Rent': 'किराया', 'Utilities': 'बिजली/पानी', 'Maintenance': 'मरम्मत', 'Packaging': 'पैकेजिंग', 'Transport': 'परिवहन', 'Other': 'अन्य' }

export default function TransactionManager({ transactions, currency, onAdd, onDelete }: TransactionManagerProps) {
  const { t, language } = useLanguage()
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [formData, setFormData] = useState({ type: 'income', category: 'Food Sales', amount: '', description: '', date: new Date().toISOString().split('T')[0] })
  const tc = (c: string) => language === 'hi' ? (catHi[c] || c) : c
  const filtered = transactions.filter(tx => { const ms = !searchTerm || tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase()); const mt = filterType === 'all' || tx.type === filterType; return ms && mt })
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const totalIncome = filtered.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const totalExpense = filtered.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.amount || Number(formData.amount) <= 0) return; onAdd({ type: formData.type, category: formData.category, amount: Number(formData.amount), description: formData.description, date: new Date(formData.date).toISOString() }); setFormData({ type: 'income', category: 'Food Sales', amount: '', description: '', date: new Date().toISOString().split('T')[0] }); setShowForm(false) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{t('transactions')}</h2><Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="h-4 w-4" />{t('addTransaction')}</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-green-500/5 border-green-200"><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-500" /><div><p className="text-sm text-muted-foreground">{t('income')}</p><p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome, currency)}</p></div></CardContent></Card>
        <Card className="bg-red-500/5 border-red-200"><CardContent className="p-4 flex items-center gap-3"><TrendingDown className="h-8 w-8 text-red-500" /><div><p className="text-sm text-muted-foreground">{t('expense')}</p><p className="text-xl font-bold text-red-600">{formatCurrency(totalExpense, currency)}</p></div></CardContent></Card>
        <Card className="bg-blue-500/5 border-blue-200"><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">{t('netProfit')}</p><p className="text-xl font-bold text-blue-600">{formatCurrency(totalIncome - totalExpense, currency)}</p></div></CardContent></Card>
      </div>
      {showForm && <Card><CardHeader><CardTitle>{t('addNew')}</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{t('type')}</Label><div className="flex gap-2"><Button type="button" variant={formData.type === 'income' ? 'default' : 'outline'} onClick={() => setFormData({ ...formData, type: 'income', category: categories.income[0] })} className="flex-1">{t('income')}</Button><Button type="button" variant={formData.type === 'expense' ? 'default' : 'outline'} onClick={() => setFormData({ ...formData, type: 'expense', category: categories.expense[0] })} className="flex-1">{t('expense')}</Button></div></div>
          <div className="space-y-2"><Label>{t('category')}</Label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-background">{(formData.type === 'income' ? categories.income : categories.expense).map(cat => <option key={cat} value={cat}>{tc(cat)}</option>)}</select></div>
          <div className="space-y-2"><Label>{t('amount')} ({currency})</Label><Input type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0" required /></div>
          <div className="space-y-2"><Label>{t('date')}</Label><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required /></div>
        </div>
        <div className="space-y-2"><Label>{t('description')}</Label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder={t('description')} /></div>
        <div className="flex gap-2"><Button type="submit">{t('save')}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t('cancel')}</Button></div>
      </form></CardContent></Card>}
      <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={t('search') + '...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><div className="flex gap-2">{['all', 'income', 'expense'].map(type => <Button key={type} variant={filterType === type ? 'default' : 'outline'} size="sm" onClick={() => setFilterType(type)}>{type === 'all' ? t('filter') : t(type)}</Button>)}</div></div>
      <Card><CardContent className="p-0">{sorted.length > 0 ? <div className="divide-y">{sorted.map(tx => <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{tx.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}</div><div><p className="font-medium">{tx.description || tc(tx.category)}</p><p className="text-sm text-muted-foreground">{tc(tx.category)} • {formatDate(tx.date)}</p></div></div><div className="flex items-center gap-3"><Badge variant={tx.type === 'income' ? 'default' : 'destructive'}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}</Badge><Button variant="ghost" size="sm" onClick={() => onDelete(tx.id)} className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button></div></div>)}</div> : <div className="text-center py-12 text-muted-foreground"><Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>{t('noTransactions')}</p><p className="text-sm">{t('addFirstTransaction')}</p></div>}</CardContent></Card>
    </div>
  )
}