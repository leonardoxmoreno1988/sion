// app/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TemporalHomePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#f9fafb]" />;

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#000f37] flex flex-col items-center justify-between antialiased selection:bg-[#e5e7eb] px-6 md:px-0" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* MINIMALIST HEADER */}
      <header className="w-full max-w-[700px] py-6 flex justify-between items-center mt-4">
        {/* Logotipo: Fuente Georgia con grosor 300, interletrado de 4px y color #000f37 */}
        <span 
          className="text-xl uppercase text-[#000f37]" 
          style={{ fontFamily: 'Georgia, serif', fontWeight: 300, letterSpacing: '4px' }}
        >
          PATMOS
        </span>
        {/* Retornamos el ratio corner a cero usando rounded-none */}
        <Link 
          href="/login" 
          className="text-xs font-bold uppercase tracking-wider border border-[#000f37] text-[#000f37] px-4 py-2 rounded-none transition-all duration-300 hover:bg-[#000f37] hover:text-[#f9fafb]"
        >
          Sign In
        </Link>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 w-full max-w-[700px] flex flex-col justify-center py-16">
        <div className="mb-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-[#000f37] max-w-xl">
            Rigorous Theological AI Search & Scripture Verification
          </h2>
        </div>

        {/* TEXTO INFORMATIVO #4b5563 */}
        <p className="text-base leading-relaxed text-[#4b5563] text-left max-w-2xl mb-12">
          Designed for deep academic inquiry and theological context utilizing strictly the Textus Receptus lineage through the King James Version (KJV). Every query is filtered under unwavering dispensational theology.
        </p>

        {/* PRIMARY CALL TO ACTION */}
        <div className="mb-16 flex flex-col items-start w-full">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#000f37] text-[#f9fafb] text-sm font-bold uppercase tracking-widest px-8 py-4 rounded-[6px] transition-all duration-300 hover:bg-[#000f37]/90"
          >
            Start Free &rarr;
          </Link>
          
          {/* Imagen adaptada al contenedor de 700px */}
          <img 
            src="https://www.leonardoxmoreno.com/files/hero.jpg" 
            alt="Patmos Platform Preview" 
            className="w-full h-auto mt-6 object-cover"
          />
        </div>

        {/* PRODUCT BENEFITS / SYSTEM PILLARS */}
        <section className="border-t border-[#e5e7eb] pt-12 mb-16">
          {/* Título aclarado a un sutil gris pizarra claro text-[#6b7280] */}
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8 font-serif">
            Architecture Pillars
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            
            {/* PILLAR 1 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                01 / Biblical Responses
              </h4>
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                Advanced source integrity controls eliminate general artificial intelligence neutrality, delivering dogmatic, absolute certainty.
              </p>
            </div>

            {/* PILLAR 2 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                02 / Textual Inerrancy
              </h4>
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                Zero lexical modification. Fully bypassing modern ecumenical translations or standard market alterations.
              </p>
            </div>

            {/* PILLAR 3 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                03 / KJV Dispensational Mechanics
              </h4>
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                Complete algorithmic focus mapping out Biblical boundaries, structural typology, and specific target audience separation.
              </p>
            </div>

            {/* PILLAR 4 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                04 / Strict Cross-References
              </h4>
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                Academic analysis running structural cross-references to expose false doctrines.
              </p>
            </div>

          </div>
        </section>

        {/* INTEGRATED PRICING SECTION */}
        <section className="border-t border-[#e5e7eb] pt-12 pb-12">
          {/* Título aclarado a un sutil gris pizarra claro text-[#6b7280] */}
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8 font-serif">
            Subscriptions & Access
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* PLAN GRATUITO: THE INQUIRER */}
            <div className="bg-white border border-[#e5e7eb] p-6 flex flex-col justify-between rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div>
                <h4 className="text-base font-bold uppercase tracking-wide text-[#000f37] mt-1">
                  Free Use
                </h4>
                <div className="mt-4 flex items-baseline text-[#000f37]">
                  <span className="text-3xl font-bold tracking-tight">$0</span>
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-[#4b5563]">/ forever</span>
                </div>
                
                <p className="mt-4 text-sm text-[#4b5563] leading-relaxed text-left">
                  Designed for casual examiners of the scriptures seeking to test the dogmatic precision.
                </p>

                <ul className="mt-6 space-y-2 border-t border-[#e5e7eb] pt-4 text-[10px] uppercase tracking-widest text-[#000f37] font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-[#4b5563]">✓</span> Limited query credits
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#4b5563]">✓</span> Base manuscript index access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#4b5563]">✓</span> Standard inquiry layout
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link 
                  href="/login"
                  className="block w-full border border-[#000f37] text-[#000f37] bg-transparent py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#000f37]/5 rounded"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* PLAN PREMIUM: THE WATCHMAN */}
            <div className="bg-white border-2 border-[#000f37] p-6 flex flex-col justify-between rounded-lg relative overflow-hidden shadow-sm">
              {/* Modificado color de fondo a bg-[#2d65f6] */}
              <div className="absolute top-0 right-0 bg-[#2d65f6] text-[#f9fafb] text-[8px] uppercase tracking-[0.2em] font-bold py-1 px-3 rounded-bl">
                PRO Version
              </div>

              <div>
                <h4 className="text-base font-bold uppercase tracking-wide text-[#000f37] mt-1">
                  Supporter
                </h4>
                <div className="mt-4 flex items-baseline text-[#000f37]">
                  <span className="text-3xl font-bold tracking-tight">$7</span>
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-[#4b5563]">/ month</span>
                </div>
                
                <p className="mt-4 text-sm text-[#4b5563] leading-relaxed text-left">
                  For serious students of the Word, approved workmen, and theologians requiring deep, unhindered pipeline execution.
                </p>

                <ul className="mt-6 space-y-2 border-t border-[#e5e7eb] pt-4 text-[10px] uppercase tracking-widest text-[#000f37] font-medium">
                  <li className="flex items-center gap-2 font-bold">
                    <span>✓</span> Uncapped continuous queries
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> Maximum pipeline priority ranking
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> Full persistent historical archiving
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> Advanced doctrinal cross-references
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a 
                  href="/api/checkout"
                  className="block w-full bg-[#000f37] text-[#f9fafb] py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#000f37]/90 rounded"
                >
                  Upgrade to PRO
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* 🛠️ NUEVA SECCIÓN: FAQS CON ACORDEONES EXPANDIBLES */}
        <section className="border-t border-[#e5e7eb] pt-12 pb-8">
          {/* Título unificado en gris claro text-[#6b7280] y tipografía serif */}
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8 font-serif">
            FAQs
          </h3>

          <div className="flex flex-col border-b border-[#e5e7eb]">
            {/* PREGUNTA 1 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-sm font-bold uppercase tracking-wide">
                  What is the primary manuscript lineage used by Patmos?
                </h4>
                <span className="relative size-5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-transparent border border-[#000f37]/20 group-open:rotate-180 transition-transform duration-300 flex items-center justify-center font-mono text-xs text-[#4b5563]">&darr;</span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Patmos maps out strict biblical context utilizing exclusively the Textus Receptus lineage through the authorized King James Version (KJV), ensuring zero modern lexical modification.
              </p>
            </details>

            {/* PREGUNTA 2 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-sm font-bold uppercase tracking-wide">
                  How does the system enforce dispensational theology?
                </h4>
                <span className="relative size-5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-transparent border border-[#000f37]/20 group-open:rotate-180 transition-transform duration-300 flex items-center justify-center font-mono text-xs text-[#4b5563]">&darr;</span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Every prompt execution runs through native filters that align data structures with right division metrics, parsing structural typology, biblical boundaries, and audience separation rules.
              </p>
            </details>

            {/* PREGUNTA 3 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-sm font-bold uppercase tracking-wide">
                  What happens when my free pipeline query allotment runs out?
                </h4>
                <span className="relative size-5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-transparent border border-[#000f37]/20 group-open:rotate-180 transition-transform duration-300 flex items-center justify-center font-mono text-xs text-[#4b5563]">&darr;</span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Once the initial free inquiry credit barrier is met, access will lock automatically. You can sustain the pipeline structure by upgrading to the Supporter level at any time.
              </p>
            </details>

            {/* PREGUNTA 4 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-sm font-bold uppercase tracking-wide">
                  Can I manage my billing or cancel my subscription dynamically?
                </h4>
                <span className="relative size-5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-transparent border border-[#000f37]/20 group-open:rotate-180 transition-transform duration-300 flex items-center justify-center font-mono text-xs text-[#4b5563]">&darr;</span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Yes. Supporter accounts gain immediate access to a secure Stripe Customer Portal integrated right into the control panel header to update credentials, download past due invoices, or adjust tiers.
              </p>
            </details>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-[700px] border-t border-[#e5e7eb] py-8 flex justify-center items-center mb-4">
        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider text-center">
          &copy; {new Date().getFullYear()} Patmos Research. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}