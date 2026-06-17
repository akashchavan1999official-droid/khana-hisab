import { useState, useEffect, useCallback } from 'react'
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext'
import { formatCurrency } from '@/lib/helpers'
import Dashboard from '@/components/Dashboard'
import TransactionManager from '@/components/TransactionManager'
import MenuManager from '@/components/MenuManager'
import OrderManager from '@/components/OrderManager'
import Reports from '@/components/Reports'
import Settings from '@/components/Settings'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { LayoutDashboard, Receipt, UtensilsCrossed, ShoppingCart, BarChart3, Settings as SettingsIcon, Menu, ChevronRight } from 'lucide-react'

const API = '/api'
interface Business { id: string; name: string; type: string; phone: string; address: string; currency: string; language: string }
interface Transaction { id: string; businessId: string; type: string; category: string; amount: number; description: string; date: string }
interface MenuItem { id: string; businessId: string; name: string; category: string; price: number; cost: number; isAvailable: boolean }
interface Order { id: string; businessId: string; customerName: string; tableNumber: number; totalAmount: number; status: string; paymentMode: string; date: string; items: { id: string; orderId: string; itemId: string; quantity: number; price: number; menuItem: { name: string } }[] }

function AppContent() {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [business, setBusiness] = useState<Business | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [bizRes, txRes, menuRes, orderRes] = await Promise.all([
        fetch(`${API}/businesses`).then(r => r.json()),
        fetch(`${API}/transactions`).then(r => r.json()),
        fetch(`${API}/menu-items`).then(r => r.json()),
        fetch(`${API}/orders`).then(r => r.json()),
      ])
      const bizList = bizRes?.items || bizRes?.data || bizRes || []
      if (Array.isArray(bizList) && bizList.length > 0) setBusiness(bizList[0])
      else {
        const res = await fetch(`${API}/businesses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'मेरा रेस्टोरेंट', type: 'restaurant', currency: '₹', language: 'hi' }) })
        setBusiness(await res.json())
      }
      setTransactions(Array.isArray(txRes?.items || txRes) ? (txRes?.items || txRes) : [])
      setMenuItems(Array.isArray(menuRes?.items || menuRes) ? (menuRes?.items || menuRes) : [])
      setOrders(Array.isArray(orderRes?.items || orderRes) ? (orderRes?.items || orderRes) : [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'businessId'>) => {
    if (!business) return
    const res = await fetch(`${API}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...tx, businessId: business.id }) })
    if (res.ok) { const n = await res.json(); setTransactions(p => [n, ...p]) }
  }
  const deleteTransaction = async (id: string) => { await fetch(`${API}/transactions/${id}`, { method: 'DELETE' }); setTransactions(p => p.filter(t => t.id !== id)) }
  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'businessId'>) => {
    if (!business) return
    const res = await fetch(`${API}/menu-items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, businessId: business.id }) })
    if (res.ok) { const n = await res.json(); setMenuItems(p => [n, ...p]) }
  }
  const deleteMenuItem = async (id: string) => { await fetch(`${API}/menu-items/${id}`, { method: 'DELETE' }); setMenuItems(p => p.filter(i => i.id !== id)) }
  const toggleMenuItem = async (id: string, available: boolean) => { await fetch(`${API}/menu-items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAvailable: available }) }); setMenuItems(p => p.map(i => i.id === id ? { ...i, isAvailable: available } : i)) }
  const addOrder = async (order: { customerName: string; tableNumber: number; totalAmount: number; paymentMode: string; items: { itemId: string; quantity: number; price: number }[] }) => {
    if (!business) return
    await fetch(`${API}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: business.id, ...order, status: 'completed' }) })
    fetchAll()
  }
  const deleteOrder = async (id: string) => { await fetch(`${API}/orders/${id}`, { method: 'DELETE' }); setOrders(p => p.filter(o => o.id !== id)) }
  const updateBusiness = async (data: Partial<Business>) => { if (!business) return; await fetch(`${API}/businesses/${business.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); setBusiness(p => p ? { ...p, ...data } : p) }

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { key: 'transactions', icon: Receipt, label: t('transactions') },
    { key: 'menu', icon: UtensilsCrossed, label: t('menu') },
    { key: 'orders', icon: ShoppingCart, label: t('orders') },
    { key: 'reports', icon: BarChart3, label: t('reports') },
    { key: 'settings', icon: SettingsIcon, label: t('settings') },
  ]

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">🍽️</div><h1 className="text-2xl font-bold">{t('appName')}</h1></div></div>

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} orders={orders} menuItems={menuItems} currency={business?.currency || '₹'} onNavigate={setActiveTab} />
      case 'transactions': return <TransactionManager transactions={transactions} currency={business?.currency || '₹'} onAdd={addTransaction} onDelete={deleteTransaction} />
      case 'menu': return <MenuManager items={menuItems} currency={business?.currency || '₹'} onAdd={addMenuItem} onDelete={deleteMenuItem} onToggle={toggleMenuItem} />
      case 'orders': return <OrderManager orders={orders} menuItems={menuItems} currency={business?.currency || '₹'} onAdd={addOrder} onDelete={deleteOrder} />
      case 'reports': return <Reports transactions={transactions} orders={orders} menuItems={menuItems} currency={business?.currency || '₹'} />
      case 'settings': return <Settings business={business} onSave={updateBusiness} />
      default: return null
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b"><div className="flex items-center gap-3"><div className="text-3xl">🍽️</div><div><h1 className="font-bold text-lg">{t('appName')}</h1><p className="text-xs text-muted-foreground">{business?.name || t('businessName')}</p></div></div></div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.key ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
            <item.icon className="h-5 w-5" />{item.label}{activeTab === item.key && <ChevronRight className="h-4 w-4 ml-auto" />}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t"><div className="text-center text-xs text-muted-foreground">{business?.currency || '₹'} • {language.toUpperCase()}</div></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/50">
      <div className="flex h-screen">
        <aside className="hidden lg:flex w-64 border-r bg-white/80 backdrop-blur-sm flex-col"><SidebarContent /></aside>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}><SheetContent side="left" className="w-64 p-0"><SidebarContent /></SheetContent></Sheet>
        <main className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden flex items-center gap-3 p-4 border-b bg-white/80 backdrop-blur-sm">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
            <div className="flex items-center gap-2"><span className="text-xl">🍽️</span><span className="font-bold">{t('appName')}</span></div>
          </div>
          <div className="flex-1 overflow-y-auto"><div className="p-4 lg:p-8 max-w-7xl mx-auto">{renderContent()}</div></div>
        </main>
      </div>
    </div>
  )
}

export default function App() { return <LanguageProvider><AppContent /></LanguageProvider> }