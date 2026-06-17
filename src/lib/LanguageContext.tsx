import React, { createContext, useContext, useState, useCallback } from 'react'
import { translations, type Language } from '@/lib/translations'

interface LanguageContextType { language: Language; setLanguage: (lang: Language) => void; t: (key: string) => string }
const LanguageContext = createContext<LanguageContextType>({ language: 'hi', setLanguage: () => {}, t: (key: string) => key })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('app-language') as Language) || 'hi')
  const handleSetLanguage = useCallback((lang: Language) => { setLanguage(lang); localStorage.setItem('app-language', lang) }, [])
  const t = useCallback((key: string): string => translations[language]?.[key] || translations['en']?.[key] || key, [language])
  return <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>{children}</LanguageContext.Provider>
}
export function useLanguage() { return useContext(LanguageContext) }