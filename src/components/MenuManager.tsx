import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/LanguageContext'
import { formatCurrency } from '@/lib/helpers'
import { Plus, Search, UtensilsCrossed, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface MenuItem { id: string; name: string; category: string; price: number; cost: number; isAvailable: boolean }
interface MenuManagerProps { items: MenuItem[]; currency: string; onAdd: (item: Omit<MenuItem, 'id'>) => void; onDelete: (id: string) => void; onToggle: (id: string, available: boolean) => void }

const menuCategories = ['Starter', 'Main Course', 'Bread', 'Rice', 'Dessert', 'Beverage', 'Snack', 'Combo']
const menuCatHi: Record<string, string> = { 'Starter': 'स्टार्टर', 'Main Course': 'मेन कोर्स', 'Bread': 'रोटी', 'Rice': 'चावल', 'Dessert': 'मिठाई', 'Beverage': 'पेय', 'Snack': 'स्नैक', 'Combo': 'कॉम्बो' }

export default function MenuManager({ items, currency, onAdd, onDelete, onToggle }: MenuManagerProps) {
  const { t, language } = useLanguage()
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [formData, setFormData] = useState({ name: '', category: 'Main Course', price: '', cost: '' })
  const tc = (c: string) => language === 'hi' ? (menuCatHi[c] || c) : c
  const filtered = items.filter(item => { const ms = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()); const mc = filterCategory === 'all' || item.category === filterCategory; return ms && mc })
  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {})

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.name || !formData.price) return; onAdd({ name: formData.name, category: formData.category, price: Number(formData.price), cost: Number(formData.cost) || 0, isAvailable: true }); setFormData({ name: '', category: 'Main Course', price: '', cost: '' }); setShowForm(false) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{t('menu')}</h2><Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="h-4 w-4" />{t('addItem')}</Button></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Card className="p-3"><p className="text-xs text-muted-foreground">{t('items')}</p><p className="text-lg font-bold">{items.length}</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('available')}</p><p className="text-lg font-bold text-green-600">{items.filter(i => i.isAvailable).length}</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('unavailable')}</p><p className="text-lg font-bold text-red-600">{items.filter(i => !i.isAvailable).length}</p></Card><Card className="p-3"><p className="text-xs text-muted-foreground">{t('category')}</p><p className="text-lg font-bold">{Object.keys(grouped).length}</p></Card></div>
      {showForm && <Card><CardHeader><CardTitle>{t('addItem')}</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>{t('name')}</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div><div className="space-y-2"><Label>{t('category')}</Label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-background">{menuCategories.map(cat => <option key={cat} value={cat}>{tc(cat)}</option>)}</select></div><div className="space-y-2"><Label>{t('price')} ({currency})</Label><Input type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required /></div><div className="space-y-2"><Label>{t('cost')} ({currency})</Label><Input type="number" min="0" step="0.01" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} /></div></div><div className="flex gap-2"><Button type="submit">{t('save')}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t('cancel')}</Button></div></form></CardContent></Card>}
      <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={t('search') + '...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><div className="flex flex-wrap gap-2"><Button variant={filterCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory('all')}>{t('filter')}</Button>{menuCategories.map(cat => <Button key={cat} variant={filterCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory(cat)}>{tc(cat)}</Button>)}</div></div>
      {Object.keys(grouped).length > 0 ? <div className="space-y-6">{Object.entries(grouped).map(([category, catItems]) => <Card key={category}><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UtensilsCrossed className="h-4 w-4" />{tc(category)}<Badge variant="secondary" className="ml-auto">{catItems.length}</Badge></CardTitle></CardHeader><CardContent className="p-0"><div className="divide-y">{catItems.map(item => <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.isAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}><UtensilsCrossed className="h-5 w-5" /></div><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{t('cost')}: {formatCurrency(item.cost, currency)} • {t('profitPerItem')}: {formatCurrency(item.price - item.cost, currency)}</p></div></div><div className="flex items-center gap-3"><Badge variant="outline" className="text-lg font-semibold">{formatCurrency(item.price, currency)}</Badge><Button variant="ghost" size="sm" onClick={() => onToggle(item.id, !item.isAvailable)} className="h-8 w-8 p-0">{item.isAvailable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}</Button><Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button></div></div>)}</div></CardContent></Card>)}</div> : <Card className="py-12"><div className="text-center text-muted-foreground"><UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>{t('noMenuItems')}</p><p className="text-sm">{t('addMenuItems')}</p></div></Card>}
    </div>
  )
}