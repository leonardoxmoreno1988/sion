'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from "./context/Languagecontext";
import { createClient } from '@supabase/supabase-js';

// Declaración global para Lemon Squeezy (evita error de TypeScript)
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

  // 🍋 Cargar script de Lemon Squeezy para Overlay e inicializarlo
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    
    script.onload = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup();
      }
    };

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

  // 🍋 LEMON SQUEEZY OVERLAY - VERSIÓN PROFESIONAL UNIFICADA
  const handleCheckout = () => {
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    // Usando el ID de producción numérico real y el modificador embed=1
    const CHECKOUT_URL = `https://patmos.lemonsqueezy.com/checkout/buy/4beafe1a-6811-457e-b7b5-02e216f8aeef?checkout[custom][user_id]=${userId}&embed=1`;

    if (window.LemonSqueezy?.Url) {
      window.LemonSqueezy.Url.open(CHECKOUT_URL);
    } else {
      // 🛡️ CORRECCIÓN: Agregamos 'noopener,noreferrer' para aislar la pestaña de forma segura
      window.open(CHECKOUT_URL, '_blank', 'noopener,noreferrer');
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
        
        <div className="flex items-center gap-3">
          {/* Selector de Idioma Optimizado */}
          <div className="inline-flex items-center border border-[#000f37] px-2 gap-1 bg-transparent h-9 md:h-7 box-sizing-border">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
            </svg>
            
            <select 
              value={lang}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
              className="bg-transparent border-none outline-none cursor-pointer text-[10px] font-bold uppercase tracking-wider h-full p-0 m-0"
              style={{
                color: '#000f37',
                fontFamily: '"Inter", sans-serif',
                WebkitAppearance: 'none', 
                MozAppearance: 'none'     
              }}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </div>

          {/* Botón Iniciar Sesión Optimizado para Móviles (Zona de toque de ~36px en móvil, ~28px en escritorio) */}
          <Link 
            href="/login" 
            className="text-[10px] font-bold uppercase tracking-widest border border-[#000f37] text-[#000f37] px-4 py-2.5 md:py-1 rounded-none transition-all duration-300 hover:bg-[#000f37] hover:text-[#f9fafb] flex items-center justify-center min-h-[36px] md:min-h-[28px]"
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
            {lang === 'es' ? "Probar 3 Consultas Gratis →" : "Try 3 Free Queries →"}
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
            
            {/* FAQ PRÁCTICA 1: LÍMITES */}
            <details className="group py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué sucede si agoto mis 3 consultas diarias gratuitas?" : "What happens if I exhaust my 3 free daily queries?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "El sistema suspenderá temporalmente la caja de entrada de texto y le mostrará un banner informativo. El contador se restablece automáticamente cada 24 horas. Si requiere continuar su flujo de investigación de manera ininterrumpida y sin restricciones, puede actualizar al Plan PRO en cualquier momento."
                ) : (
                  "The system will temporarily suspend the text input box and present an information banner. The counter automatically resets every 24 hours. If your research workflow requires uninterrupted, unrestricted execution, you may upgrade to the PRO Plan at any moment."
                )}
              </p>
            </details>

            {/* FAQ PRÁCTICA 2: CANCELACIÓN */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Cómo puedo gestionar o cancelar mi suscripción?" : "How do I manage or cancel my subscription?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Puede hacerlo con total autonomía y con un solo clic. Dentro de la plataforma del chat, encontrará un botón llamado 'Factura' que le redirigirá al Hub de Gestión de Lemon Squeezy. También puede acceder de forma directa mediante el enlace seguro que se envía a su correo electrónico en cada facturación. No hay contratos forzosos ni penalizaciones."
                ) : (
                  "You can do so with absolute autonomy and via a single click. Inside the chat interface, you will find a 'Bill' button that routes directly to the secure Lemon Squeezy Management Hub. Alternatively, you can access it through the secure link transmitted to your email address with each billing cycle. There are no locking contracts or cancellation penalties."
                )}
              </p>
            </details>

            {/* FAQ TEOLÓGICA 1 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre la Biblia?" : "What does Patmos teach about the Bible?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Sostiene que la autoridad suprema, exclusiva y final para toda fe y ejecución del ministerio es la palabra de Dios infalible y estructuralmente preservada—encarnada estrictamente dentro de la Biblia Reina Valera 1865 y la Versión Autorizada King James para el mundo de habla inglesa. Opera bajo la convicción absoluta de que todas las traducciones modernas introducen distorsiones teológicas y corrupciones sistémicas (Salmos 12:6-7)."
                ) : (
                  "It holds that the supreme, exclusive, and final authority for all faith and ministry execution is the flawless, structurally preserved word of God—embodied strictly within the Authorized King James Holy Bible for the English-speaking world. It operates on the absolute conviction that all modern translations introduce theological distortions and systemic corruptions (Psalms 12:6-7)."
                )}
              </p>
            </details>

            {/* FAQ TEOLÓGICA 2 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre Dios?" : "What does Patmos teach about God?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Reconoce a una Deidad suprema y triuna, que existe eternamente en tres Personas distintas: el Padre, la Palabra y el Espíritu Santo. Sostiene que cada miembro de la Trinidad es coeterno en existencia, coidéntico en su naturaleza esencial, coigual en poder soberano y perfectamente integrado dentro de los mismos atributos absolutos y perfecciones divinas (Deuteronomio 6:4; 1 Timoteo 1:17; 1 Juan 5:7)."
                ) : (
                  "It recognizes one supreme, triune Godhead, eternally existing across three distinct Persons: the Father, the Word, and the Holy Ghost. It holds that each constituent of the Trinity is co-eternal in existence, co-identical in core nature, co-equal in sovereign power, and perfectly integrated within the absolute self-same attributes and divine perfections (Deuteronomy 6:4; 1 Timothy 1:17; 1 John 5:7)."
                )}
              </p>
            </details>

            {/* FAQ TEOLÓGICA 3 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre Jesucristo?" : "What does Patmos teach about Jesus Christ?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Afirma la deidad absoluta y la perfecta humanidad del Señor Jesucristo en una unión hipostática indivisible. Sostiene Su nacimiento virginal, Su vida sin pecado, Su sacrificio expiatorio y sustitutivo en la cruz mediante el derramamiento de Su sangre preciosa, Su resurrección corporal y Su ascensión gloriosa a la diestra del Padre (Filipenses 2:5-8; 1 Pedro 2:24; Hechos 1:9-11)."
                ) : (
                  "It affirms the absolute deity and perfect humanity of the Lord Jesus Christ in one indivisible hypostatic union. It holds to His virgin birth, His sinless life, His substitutionary atoning sacrifice on the cross through the shedding of His precious blood, His bodily resurrection, and His glorious ascension to the right hand of the Father (Philippians 2:5-8; 1 Peter 2:24; Acts 1:9-11)."
                )}
              </p>
            </details>

            {/* FAQ TEOLÓGICA 4 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre los Tiempos y Dispensaciones?" : "What does Patmos teach about Times and Dispensations?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Sostiene una hermenéutica literal y dispensacional estricta, administrando bien la palabra de verdad. Reconoce la separación absoluta entre los planes de Dios para la Iglesia de Cristo y la nación de Israel. Defiende la expectativa inminente del rapto pretribulacional y el posterior establecimiento del reino milenial literal sobre la tierra (2 Timoteo 2:15; Romanos 11:25-26; 1 Tesalonicenses 4:16-17)."
                ) : (
                  "It maintains a strict literal and dispensational hermeneutic, rightly dividing the word of truth. It recognizes the absolute separation between God's distinct programs for the Church of Christ and the nation of Israel. It upholds the imminent pre-tribulation rapture and the subsequent literal millennial reign upon the earth (2 Timothy 2:15; Romans 11:25-26; 1 Thessalonians 4:16-17)."
                )}
              </p>
            </details>

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