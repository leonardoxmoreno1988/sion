'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from "./context/Languagecontext"; // 🌐 Conexión al motor de idiomas global

export default function HomePage() {
  const { lang, setLanguage } = useLanguage(); // 🌐 Extraemos lang y setLanguage para el dropdown
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // 🧙‍♂️ MÉTODO MAGO DE OZ: Tu botón abre la suscripción y te lleva a la pantalla de espera
  const handleCheckout = () => {
    // 🔗 URL de suscripción pública de PayPal corregida para tus compradores externos
    const PAYPAL_DIRECT_URL = `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-2G8977490J925452WNIL7QAA`; 

    // Abre la pasarela de PayPal segura en una pestaña nueva
    window.open(PAYPAL_DIRECT_URL, '_blank');

    // Redirige tu landing a la pantalla de éxito/sincronización premium
    window.location.href = '/checkout/success';
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
        
        {/* Contenedor de Utilidades del Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* 🌐 DROPDOWN SELECTOR DE IDIOMA */}
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
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, display: 'block' }}>
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
              <option value="en" style={{ backgroundColor: '#fff', color: '#000f37' }}>EN</option>
              <option value="es" style={{ backgroundColor: '#fff', color: '#000f37' }}>ES</option>
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
              <>Advanced Scripture<br/>Research & Analytics</>
            )}
          </h1>
        </div>

        <p className="text-2xl font-medium text-[#000f37] max-w-xl">
          {lang === 'es' ? (
            <>Análisis indexado y preciso extraído exclusivamente de la <span className="font-semibold">Reina Valera 1865 y la KJV</span>.</>
          ) : (
            <>Precise, cross-referenced insights drawn exclusively from the <span className="font-semibold">Authorized King James Version</span>.</>
          )}
        </p>

        <p className="text-lg leading-relaxed text-[#374151] mt-6 max-w-2xl">
          {lang === 'es' ? (
            <>Software diseñado para el escrutinio literal, dispensacional y pretribulacional de las Escrituras. Sin traducciones modernas ni interpretaciones externas.</>
          ) : (
            <>Software engine designed for the literal, dispensational, and pre-tribulational study of Scripture.<br/>No modern translations. Pure manuscript analysis.</>
          )}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#000f37] text-[#f9fafb] text-base font-semibold px-10 py-5 rounded-xl hover:bg-black transition-all"
          >
            {lang === 'es' ? "Ingresar a Patmos →" : "Access Patmos Engine →"}
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          {lang === 'es' ? "Uso básico: 3 consultas por día • Plan PRO: Ilimitado por $7/mes" : "Basic access: 3 queries per day • PRO Plan: Unlimited for $7/month"}
        </p>

        {/* Imagen */}
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
                {lang === 'es' 
                  ? "Cada consulta de datos se procesa directa y exclusivamente sobre la Versión King James y la Reina Valera 1865." 
                  : "Every data query maps directly and exclusively to the Authorized King James Version."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Postura Pretribulacional Firme" : "Firm Pre-Trib Stance"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' 
                  ? "Defiende la enseñanza literal del Arrebatamiento antes de la Tribulación y la 70ª Semana de Daniel." 
                  : "Defends the literal teaching of the Rapture before the Tribulation and the 70th Week of Daniel."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Sin Opiniones Humanas" : "No Human Opinions"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' 
                  ? "Sin comentarios añadidos, sin autores modernos — solo la indexación pura de la Palabra de Dios." 
                  : "No commentaries, no external authors — only pure computational indexing of the Word of God."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Administrando Bien la Palabra" : "Rightly Dividing the Word"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' 
                  ? "Diseñado estructuralmente para sostener la distinción dispensacional entre Israel y la Iglesia." 
                  : "Structurally designed to uphold the dispensational distinction between Israel and the Church."}
              </p>
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
                <h4 className="text-xl font-semibold">{lang === 'es' ? "Apoya a Patmos" : "Support Patmos"}</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold">$7</span>
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
            {/* FAQ 1 */}
            <details className="group py-4 border-t border-[#e5e7eb] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué tipo de software es Patmos?" : "What kind of software is Patmos?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Es una plataforma de software de investigación teológica basada en datos estructurados que procesa, indexa y mapea patrones textuales dentro de la Biblia Reina Valera y la King James (Salmos 12:6-7)."
                ) : (
                  "It is a data-driven theological research software platform that processes, indexes, and maps textual patterns strictly within the Authorized King James Holy Bible (Psalms 12:6-7)."
                )}
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="group py-4 border-t border-[#e5e7eb] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Cómo se procesan e indexan los datos de las consultas?" : "How are query data requests processed and indexed?"}
                </h4>
                <svg className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Todas las operaciones computacionales se ejecutan del lado del servidor a través de nuestra arquitectura de base de datos dedicada. El sistema realiza contrastes en tiempo real sobre esquemas de datos relacionales para entregar matrices analíticas sólidas de manera inmediata."
                ) : (
                  "All computational query operations are executed server-side via our isolated relational database structures. The system performs real-time cross-referencing over structured data schemas to deliver instant analytical insights reliably."
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