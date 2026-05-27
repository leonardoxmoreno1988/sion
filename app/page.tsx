'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from "./context/Languagecontext"; // 🌐 Conexión al motor de idiomas global
import { usePaddleInstance } from "@/components/PaddleProvider"; // 💳 Importamos el hook seguro del proveedor
import { createBrowserClient } from '@supabase/ssr';

export default function HomePage() {
  const { lang, setLanguage } = useLanguage(); // 🌐 Extraemos lang y setLanguage para el dropdown
  const [isMounted, setIsMounted] = useState(false);
  const paddle = usePaddleInstance(); // 🚀 Consumimos la instancia real y activa de Paddle v2
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

  useEffect(() => {
    setIsMounted(true);
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // 💳 Manejador interactivo y blindado para abrir la pasarela amarrada a Supabase
  const handleCheckout = async () => {
    if (!paddle) {
      console.warn("Paddle aún se está inicializando... Espera un segundo.");
      return;
    }

    try {
      // 🕵️ Recuperamos la sesión activa del usuario actual en Supabase
      const { data: { session } } = await supabase.auth.getSession();

      // 🚨 CONTROL DE FLUJO SEGURO: Si no ha iniciado sesión, lo mandamos primero a autenticarse
      if (!session || !session.user) {
        window.location.href = '/login';
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email;

      // 🚀 Tu ID real de Sandbox verificado
      const PATMOS_PRICE_ID = "pri_01ksjj24ksyxjm70nsqqapaht6"; 

      paddle.Checkout.open({
        items: [
          {
            priceId: PATMOS_PRICE_ID,
            quantity: 1
          }
        ],
        // 📧 Seteamos el correo automáticamente para ahorrarle pasos al cliente
        customer: userEmail ? { email: userEmail } : undefined,
        
        // 🔒 METADATOS METIDOS BAJO LLAVE: Esto viajará con Paddle y volverá intacto al Webhook
        customData: {
          supabase_user_id: userId
        },
        settings: {
          displayMode: "overlay", // Abre el modal flotante elegante
          theme: "light",         // Mantiene el look corporativo limpio
          locale: "en"            // Idioma internacional de cobro
        }
      });
    } catch (err) {
      console.error("Error al procesar los datos de sesión para el checkout:", err);
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
        
        {/* Contenedor de Utilidades del Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* 🌐 DROPDOWN SELECTOR DE IDIOMA CON ICONO MAPAMUNDI (Estilo Outlined idéntico al chat) */}
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
            {/* Ícono Mapamundi SVG Nativo */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, display: 'block' }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
            </svg>
            
            {/* Selector Select Tag Sin Bordes Nativos */}
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

          {/* Botón Sign In / Iniciar Sesión */}
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
              <>Investigación Profunda de la Biblia con IA</>
            ) : (
              <>Ask Anything<br/>from the KJV Bible</>
            )}
          </h1>
        </div>

        <p className="text-2xl font-medium text-[#000f37] max-w-xl">
          {lang === 'es' ? (
            <>Respuestas claras y fieles extraídas exclusivamente de la <span className="font-semibold">Reina Valera</span>.</>
          ) : (
            <>Clear, faithful answers drawn exclusively from the <span className="font-semibold">Authorized King James Version</span>.</>
          )}
        </p>

        <p className="text-lg leading-relaxed text-[#374151] mt-6 max-w-2xl">
          {lang === 'es' ? (
            <>Defiende la enseñanza literal, dispensacional y pretribulacional de las Escrituras. Sin traducciones modernas ni filosofías humanas.</>
          ) : (
            <>Defends the literal, dispensational, pre-tribulational teaching of Scripture.<br/>No modern translations. No compromise.</>
          )}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#000f37] text-[#f9fafb] text-base font-semibold px-10 py-5 rounded-xl hover:bg-black transition-all"
          >
            {lang === 'es' ? "Usa Patmos Ahora →" : "Start Asking Patmos Now →"}
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          {lang === 'es' ? "Gratis: 15 preguntas por día • Soporte: Ilimitado por $7/mes" : "Free: 15 questions per day • Support: Unlimited for $7/month"}
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
            {lang === 'es' ? "Creado Exclusivamente para Creyentes de la Biblia" : "Built Exclusively for Bible Believers"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Solo la KJV" : "KJV Only"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' 
                  ? "Cada respuesta se extrae directa y exclusivamente de la Versión Autorizada King James." 
                  : "Every answer is drawn directly and exclusively from the Authorized King James Version."}
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
                  ? "Sin comentarios, sin autores, sin interpretaciones modernas — solo la pura Palabra de Dios." 
                  : "No commentaries, no authors, no modern interpretations — only the pure Word of God."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">{lang === 'es' ? "Trazando Bien la Palabra" : "Rightly Dividing the Word"}</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                {lang === 'es' 
                  ? "Diseñado para sostener la distinción dispensacional entre Israel y la Iglesia." 
                  : "Designed to uphold the dispensational distinction between Israel and the Church."}
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
                <h4 className="text-xl font-semibold">{lang === 'es' ? "Gratuito" : "Free"}</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="ml-2 text-gray-500">{lang === 'es' ? "/ para siempre" : "/ forever"}</span>
                </div>
                <p className="mt-6 text-[#4b5563]">
                  {lang === 'es' ? "Perfecto para pruebas y uso diario." : "Perfect for testing and daily use."}
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "15 preguntas por día" : "15 questions per day"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Respuestas completas de la KJV" : "Full KJV answers"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Defensa pretribulacional" : "Pre-trib defense"}</li>
                </ul>
              </div>
              <Link 
                href="/login"
                className="block w-full text-center mt-10 border border-[#000f37] py-4 font-semibold rounded-xl hover:bg-gray-50"
              >
                {lang === 'es' ? "Comenzar Gratis" : "Start Free"}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-[#000f37] p-8 rounded-xl relative flex flex-col justify-between">
              <div className="absolute -top-3 right-6 bg-[#2d65f6] text-white text-xs px-4 py-1 rounded-full font-medium">
                {lang === 'es' ? "RECOMENDADO" : "RECOMMENDED"}
              </div>
              
              <div>
                <h4 className="text-xl font-semibold">{lang === 'es' ? "Patrocinador" : "Become a Supporter"}</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold">$7</span>
                  <span className="ml-2 text-gray-500">{lang === 'es' ? "/ mes" : "/ month"}</span>
                </div>
            
                <p className="mt-4 text-sm leading-relaxed text-[#4b5563]">
                  {lang === 'es' 
                    ? "Su apoyo ayuda a mantener a Patmos puro, independiente y enfocado únicamente en  para creyentes de todo el mundo." 
                    : "Your support helps keep Patmos pure, independent, and focused only on the KJV for believers around the world."}
                </p>
                
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Preguntas ilimitadas" : "Unlimited questions"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Respuestas más rápidas" : "Faster responses"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Historial completo de conversaciones" : "Full conversation history"}</li>
                  <li className="flex items-center gap-2">✓ {lang === 'es' ? "Acceso prioritario" : "Priority access"}</li>
                </ul>
              </div>
              
              {/* 💳 Botón perfectamente conectado de forma reactiva y segura */}
              <button 
                onClick={handleCheckout}
                className="block w-full text-center mt-10 bg-[#000f37] text-white py-4 font-semibold rounded-xl hover:bg-black border-none cursor-pointer outline-none"
              >
                {lang === 'es' ? "Pasar a Pro" : "Upgrade to Pro"}
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
            
            {/* PREGUNTA 1 */}
            <details className="group py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre la Biblia?" : "What does Patmos teach about the Bible?"}
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Sostiene que la autoridad suprema, exclusive y final para toda faith y ejecución del ministerio es la palabra de Dios infalible y estructuralmente preservada—encarnada estrictamente dentro de la Santa Biblia Autorizada King James para el mundo de habla inglesa. Opera bajo la convicción absoluta de que todas las traducciones modernas introducen distorsiones teológicas y corrupciones sistémicas (Salmos 12:6-7)."
                ) : (
                  "It holds that the supreme, exclusive, and final authority for all faith and ministry execution is the flawless, structurally preserved word of God—embodied strictly within the Authorized King James Holy Bible for the English-speaking world. It operates on the absolute conviction that all modern translations introduce theological distortions and systemic corruptions (Psalms 12:6-7)."
                )}
              </p>
            </details>

            {/* PREGUNTA 2 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre Dios?" : "What does Patmos teach about God?"}
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Reconoce a una Deidad suprema y triuna, que existe eternamente en tres Personas distintas: el Padre, la Palabra y el Espíritu Santo. Sostiene que cada miembro de la Trinidad es coeterno en existence, coidéntico en su naturaleza essencial, coigual en poder soberano y perfectamente integrado dentro de los mismos atributos absolutos y perfecciones divinas (Deuteronomio 6:4; 1 Timoteo 1:17; 1 Juan 5:7)."
                ) : (
                  "It recognizes one supreme, triune Godhead, eternally existing across three distinct Persons: the Father, the Word, and the Holy Ghost. It holds that each constituent of the Trinity is co-eternal in existence, co-identical in core nature, co-equal in sovereign power, and perfectly integrated within the absolute self-same attributes and divine perfections (Deuteronomy 6:4; 1 Timothy 1:17; 1 Juan 5:7)."
                )}
              </p>
            </details>

            {/* PREGUNTA 3 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre Jesucristo?" : "What does Patmos teach about Jesus Christ?"}
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Afirma la deidad absoluta de Jesucristo, su nacimiento virginal preciso, su muerte sustitutiva vicaria por los pecadores, su resurrección física y literal, y su ascensión corporal y literal a los cielos (1 Timoteo 3:16)."
                ) : (
                  "It affirms the absolute Deity of Jesus Christ, His precise virgin birth, His vicarious substitutionary death for sinners, His literal, physical resurrection, and His literal, bodily ascension into the heavens (1 Timothy 3:16)."
                )}
              </p>
            </details>

            {/* PREGUNTA 4 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  {lang === 'es' ? "¿Qué enseña Patmos sobre los Últimos Días?" : "What does Patmos teach about the Last Days?"}
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                {lang === 'es' ? (
                  "Sostiene el regreso inminente del Señor Jesús para arrebatar a la Iglesia antes del período de la Tribulación. En la culminación de la Tribulación, Cristo regresará físicamente a la tierra, establecerá Su reinado soberano desde la histórica ciudad de Jerusalén y confirmará plenamente Su realeza sobre el Reino Mesiánico terrenal prometido incondicionalmente a la nación de Israel (Lucas 21:21-23; 1 Tesalonicenses 5:9; Romanos 11:25-29; Apocalipsis 19:11-16; 20:1-6)."
                ) : (
                  "It holds to the imminent return of the Lord Jesus Christ to rapture the Church prior to the Tribulation period. At the culmination of the Tribulation, Christ will return physically to earth, establish His sovereign reign from the historic city of Jerusalem, and fully confirm His kingship over the earthly Messianic Kingdom promised unconditionally to the nation of Israel (Luke 21:21-23; 1 Thessalonians 5:9; Romanos 11:25-29; Revelation 19:11-16; 20:1-6)."
                )}
              </p>
            </details>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-[700px] border-t border-[#e5e7eb] py-8 flex justify-center items-center">
        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider text-center">
          © {new Date().getFullYear()} Patmos Research. {lang === 'es' ? "Todos los derechos reservados." : "All Rights Reserved."}
        </p>
      </footer>
    </div>
  );
}