'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from "./context/Languagecontext";
import { createClient } from '@supabase/supabase-js';

// Declaración para TypeScript (Lemon Squeezy)
declare global {
  interface Window {
    LemonSqueezy: any;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const { lang, setLanguage } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Cargar script de Lemon Squeezy para Overlay
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[src="https://app.lemonsqueezy.com/js/lemon.js"]');
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    checkUser();
  }, []);

  // 🍋 LEMON SQUEEZY OVERLAY - VERSIÓN PROFESIONAL
  const handleCheckout = () => {
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    const CHECKOUT_URL = `https://patmos.lemonsqueezy.com/checkout/buy/4beafe1a-6811-457e-b7b5-02e216f8aeef?checkout[custom][user_id]=${userId}`;

    if (window.LemonSqueezy?.Url) {
      window.LemonSqueezy.Url.open(CHECKOUT_URL);
    } else {
      window.open(CHECKOUT_URL, '_blank');
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#f9fafb]" />;

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#000f37] flex flex-col items-center justify-between antialiased selection:bg-[#e5e7eb] px-6 md:px-0" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* HEADER */}
      <header className="w-full max-w-[700px] py-6 flex justify-between items-center mt-4">
        <Link href="/" className="flex items-center transition-opacity duration-200 hover:opacity-80">
          <img 
            src="https://www.leonardoxmoreno.com/files/logo-patmos.svg" 
            alt="Patmos Research Logo" 
            className="h-4 w-auto object-contain"
          />
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            border: '1px solid #000f37',
            padding: '0 6px', 
            gap: '4px',
            backgroundColor: 'transparent',
            height: '24px', 
            boxSizing: 'border-box'
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
            </svg>
            
            <select 
              value={lang}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
              style={{
                fontSize: '9px',
                fontWeight: '700',
                color: '#000f37',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
                textTransform: 'uppercase',
                padding: 0,
                margin: 0,
                lineHeight: '24px', 
                height: '100%',
                WebkitAppearance: 'none', 
                MozAppearance: 'none'     
              }}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </div>

          <Link 
            href="/login" 
            className="text-xs font-bold uppercase tracking-wider border border-[#000f37] text-[#000f37] px-4 py-2 rounded-none transition-all duration-300 hover:bg-[#000f37] hover:text-[#f9fafb] flex items-center"
            style={{ height: '24px', boxSizing: 'border-box', padding: '0 16px' }}
          >
            {lang === 'es' ? "Iniciar Sesión" : "Sign In"}
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 w-full max-w-[700px] flex flex-col justify-center py-16">
        <div className="mb-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight text-[#000f37]">
            {lang === 'es' ? (
              <>Motor de Investigación y Análisis Bíblico</>
            ) : (
              <>Biblical KJV Research &<br/>Analysis Engine</>
            )}
          </h1>
        </div>

        <p className="text-2xl font-medium text-[#000f37] max-w-xl">
          {lang === 'es' ? (
            <>Archivo indexado y preciso extraído exclusivamente de la <span className="font-semibold">Reina Valera 1865 y la KJV</span>.</>
          ) : (
            <>Precise, cross-referenced insights drawn exclusively from the <span className="font-semibold">Authorized King James Version</span>.</>
          )}
        </p>

        <p className="text-lg leading-relaxed text-[#374151] mt-6 max-w-2xl">
          {lang === 'es' ? (
            <>Software diseñado para el escrutinio literal, dispensacional y pretribulacional de las Escrituras. Sin traducciones modernas ni interpretaciones genéricas.</>
          ) : (
            <>Software engine designed for the literal, dispensational, and pre-tribulational study of Scripture.<br/>No modern translations. Pure bible analysis.</>
          )}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#000f37] text-[#f9fafb] text-base font-semibold px-10 py-5 rounded-xl hover:bg-black transition-all"
          >
            {lang === 'es' ? "Iniciar Investigación →" : "Start Research →"}
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          {lang === 'es' ? "Uso básico: 3 consultas por día • Plan PRO: Ilimitado por $15/mes" : "Basic access: 3 queries per day • PRO Plan: Unlimited for $15/month"}
        </p>

        <img 
          src="https://www.leonardoxmoreno.com/files/patmos-illustration.jpg" 
          alt="Patmos Platform Preview" 
          className="w-full h-auto mt-8 block mb-0"
        />

        {/* BENEFITS SECTION */}
        <section className="mt-0 border-t border-[#e5e7eb] pt-12">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8">
            {lang === 'es' ? "Creado para Creyentes de la Biblia" : "Built Exclusively for Bible Believers"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Solo RV1865 Y KJV" : "KJV Only"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' ? "Cada consulta de datos se procesa directa y exclusivamente sobre la Versión King James y la Reina Valera 1865." : "Every data query maps directly and exclusively to the Authorized King James Version."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Postura Pretribulacional Firme" : "Firm Pre-Trib Stance"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' ? "Defiende la enseñanza literal del Arrebatamiento antes de la Tribulación y la 70ª Semana de Daniel." : "Defends the literal teaching of the Rapture before the Tribulation and the 70th Week of Daniel."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Sin Opiniones Humanas" : "No Human Opinions"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' ? "Sin comentarios añadidos, sin autores modernos — solo la indexación pura de la Palabra de Dios." : "No commentaries, no external authors — only pure computational indexing of the Word of God."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Administrando Bien la Palabra" : "Rightly Dividing the Word"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' ? "Diseñado estructuralmente para sostener la distinción dispensacional entre Israel y la Iglesia." : "Structurally designed to uphold the dispensational distinction between Israel and the Church."}
              </p>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="mt-20 border-t border-[#e5e7eb] pt-12">
          <div className="flex flex-col gap-6">
            <p className="text-xl md:text-2xl font-medium text-[#000f37] leading-relaxed">
              {lang === 'es' ? (
                <>“Súper intuitivo y potente. Patmos transforma completamente cómo estudio la Biblia. Esta alternativa es exactamente lo que el estudiante de la Biblia necesita.”</>
              ) : (
                <>“Super intuitive and powerful. Patmos completely transforms how I study the Bible. This alternative is exactly what the Bible student needs.”</>
              )}
            </p>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#000f37] text-[#f9fafb] flex items-center justify-center text-sm font-bold tracking-tight select-none shrink-0">
                J
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#000f37]">Jesus Navarro</span>
                <span className="text-xs text-[#6b7280] font-medium mt-0.5">
                  {lang === 'es' ? "Diseñador de Productos y Creyente de la Biblia" : "Product Designer and Bible Believer"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="mt-20 border-t border-[#e5e7eb] pt-12">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8">
            {lang === 'es' ? "Seleccione su Acceso" : "Choose Your Access"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-white border border-[#cbd5e1] p-8 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-semibold">{lang === 'es' ? "Básico" : "Basic"}</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="ml-2 text-gray-500">{lang === 'es' ? "/ para siempre" : "/ forever"}</span>
                </div>
                <p className="mt-6 text-[#4b5563]">
                  {lang === 'es' ? "Perfecto para indexación y análisis diario." : "Perfect for testing and daily analysis."}
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "3 consultas de texto por día" : "3 text queries per day"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Estructura completa RV1865+KJV" : "Full KJV structure mappings"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Filtrado pretribulacional" : "Pre-trib filters"}</li>
                </ul>
              </div>
              <Link 
                href="/login"
                className="block w-full text-center mt-10 border border-[#000f37] py-4 font-semibold rounded-xl hover:bg-gray-50"
              >
                {lang === 'es' ? "Comenzar" : "Start Now"}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-[#000f37] p-8 rounded-xl relative flex flex-col justify-between">
              <div className="absolute -top-3 right-6 bg-[#2d65f6] text-white text-xs px-4 py-1 rounded-full font-medium">
                {lang === 'es' ? "PLAN PRO" : "PRO PLAN"}
              </div>
              
              <div>
                <h4 className="text-xl font-semibold">{lang === 'es' ? "Apoya a Patmos — Ilimitado" : "Support Patmos — Unlimited"}</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold">$15</span>
                  <span className="ml-2 text-gray-500">{lang === 'es' ? "/ mes" : "/ month"}</span>
                </div>
                
                <p className="mt-4 text-sm leading-relaxed text-[#4b5563]">
                  {lang === 'es' 
                    ? "Su apoyo ayuda a mantener a Patmos independiente y enfocado únicamente en herramientas de análisis de la Reina Valera." 
                    : "Your support helps keep Patmos independent and focused only on analytical KJV software tools."}
                </p>
                
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Consultas de datos ilimitadas" : "Unlimited data queries"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Procesamiento de datos prioritario" : "Priority data processing"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Historial completo de análisis" : "Full analysis history"}</li>
                </ul>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="block w-full text-center mt-10 bg-[#000f37] text-white py-4 font-semibold rounded-xl hover:bg-black border-none cursor-pointer outline-none transition-all"
              >
                {lang === 'es' ? "Obtener Acceso Ilimitado" : "Unlock Unlimited Access"}
              </button>
            </div>
          </div>
        </section>

        {/* FAQS */}
        <section className="mt-20 border-t border-[#e5e7eb] pt-12 pb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8">
            {lang === 'es' ? "Preguntas Frecuentes" : "FAQs"}
          </h3>

          <div className="flex flex-col border-b border-[#e5e7eb]">
            {/* Tus details de FAQ se mantienen igual */}
            {/* ... (puedes copiarlos de tu versión anterior) ... */}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-[700px] border-t border-[#e5e7eb] py-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase text-[#6b7280]">
          <Link href="/terms" className="hover:text-[#000f37] transition-colors duration-200 normal-case">
            {lang === 'es' ? "Términos de Servicio" : "Terms of Service"}
          </Link>
          <Link href="/privacy" className="hover:text-[#000f37] transition-colors duration-200 normal-case">
            {lang === 'es' ? "Política de Privacidad" : "Privacy Policy"}
          </Link>
          <Link href="/refund" className="hover:text-[#000f37] transition-colors duration-200 normal-case">
            {lang === 'es' ? "Reembolsos y Cancelación" : "Refund Policy"}
          </Link>
        </div>

        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider text-center">
          © {new Date().getFullYear()} Patmos Research. {lang === 'es' ? "Todos los derechos reservados." : "All Rights Reserved."}
        </p>
      </footer>
    </div>
  );
}