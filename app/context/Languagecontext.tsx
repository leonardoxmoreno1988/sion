'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaries, Language } from '../constants/translations';

interface LanguageContextType {
  lang: Language;
  t: typeof dictionaries['en'];
  setLanguage: (newLang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en'); // Por defecto inglés

  useEffect(() => {
    // 1. Intentar leer la cookie guardada previamente
    const savedLang = document.cookie
      .split('; ')
      .find((row) => row.startsWith('patmos_lang='))
      ?.split('=')[1] as Language;

    if (savedLang === 'en' || savedLang === 'es') {
      setLang(savedLang);
    } else {
      // 2. Si no hay cookie, usamos la geolocalización o el idioma del navegador
      // La API 'Intl' es ultra rápida y detecta la zona horaria/idioma del sistema operativo
      const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
      setLanguage(browserLang);
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    // Guardamos la cookie por 365 días para que recuerde su decisión
    document.cookie = `patmos_lang=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  const t = dictionaries[lang];

  return (
    <LanguageContext.Provider value={{ lang, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  return context;
}