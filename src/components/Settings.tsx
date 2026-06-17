import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/LanguageContext'
import { languageNames, type Language } from '@/lib/translations'
import { Store, Globe, Save } from 'lucide-react'

interface Business { id: string; name: string; type: string; phone: string; address: string; currency: string; language: string }
interface SettingsProps { business: Business | null; onSave: (data: Partial<Business>) => void }

const currencies = [{ code: '₹', name: 'Indian Rupee (₹)' }, { code: '$', name: 'US Dollar ($)' }, { code: '€', name: 'Euro (€)' }]
const businessTypes = [{ value: 'restaurant', labelHi: 'रेस्टोरेंट', labelEn: 'Restaurant' }, { value: 'cafe', labelHi: 'कैफ़े', labelEn: 'Cafe' }, { value: 'hotel', labelHi: 'होटल', labelEn: 'Hotel' }, { value: 'food_truck', labelHi: 'फूड ट्रक', labelEn: 'Food Truck' }, { value: 'bakery', labelHi: 'बेकरी', labelEn: 'Bakery' }]

export default function Settings({ business, onSave }: SettingsProps) {
  const { t, language, setLanguage } = useLanguage()
  const [formData, setFormData] = useState({ name: business?.name || '', type: business?.type || 'restaurant', phone: business?.phone || '', address: business?.address || '', currency: business?.currency || '₹' })
  const [saved, setSaved] = useState(false)
  const handleSave = () => { onSave(formData); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('settings')}</h2>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{t('selectLanguage')}</CardTitle></CardHeader>
        <CardContent><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(languageNames) as Language[]).map(lang => (
            <Button key={lang} variant={language === lang ? 'default' : 'outline'} onClick={() => setLanguage(lang)} className="h-auto py-4 flex flex-col items-center gap-1">
              <span className="text-2xl">{lang === 'hi' ? '🇮🇳' : lang === 'en' ? '🇬🇧' : '🇮🇳'}</span>
              <span className="font-medium">{languageNames[lang]}</span>
              {language === lang && <Badge className="mt-1">✓</Badge>}
            </Button>
          ))}
        </div></CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />{t('businessProfile')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t('businessName')}</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('type')}</Label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-background">{businessTypes.map(bt => <option key={bt.value} value={bt.value}>{language === 'hi' ? bt.labelHi : bt.labelEn}</option>)}</select></div>
            <div className="space-y-2"><Label>{t('phone')}</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" /></div>
            <div className="space-y-2"><Label>{t('currency')}</Label><select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-background">{currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
          </div>
          <div className="space-y-2"><Label>{t('address')}</Label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
          <Button onClick={handleSave} className="gap-2">{saved ? <>✓ {t('save')}</> : <><Save className="h-4 w-4" /> {t('save')}</>}</Button>
        </CardContent>
      </Card>
    </div>
  )
}