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
        {/* 🛠️ CORRECCIÓN: Retornamos el ratio corner a cero usando rounded-none */}
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

        {/* 🖋️ TEXTO OSCURECIDO DE #6b7280 A #4b5563 */}
        <p className="text-base leading-relaxed text-[#4b5563] text-left max-w-2xl mb-12">
          Designed for deep academic inquiry and theological context utilizing strictly the Textus Receptus lineage through the King James Version (KJV). Every query is filtered under unwavering dispensational theology.
        </p>

        {/* PRIMARY CALL TO ACTION */}
        <div className="mb-16 flex flex-col items-start w-full">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#000f37] text-[#f9fafb] text-sm font-bold uppercase tracking-widest px-8 py-4 rounded-[8px] transition-all duration-300 hover:bg-[#000f37]/90"
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
          {/* Subtítulo de sección oscurecido de #6b7280 A #4b5563 */}
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#4b5563] mb-8 font-serif">
            Core Architecture Pillars
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            
            {/* PILLAR 1 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                01 / Manuscript Database Integration
              </h4>
              {/* 🖋️ TEXTO OSCURECIDO */}
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                High-fidelity data retrieval directly anchored to recovered textual fragments. Advanced source integrity controls eliminate general artificial intelligence neutrality, delivering dogmatic, absolute certainty.
              </p>
            </div>

            {/* PILLAR 2 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                02 / Textual Inerrancy
              </h4>
              {/* 🖋️ TEXTO OSCURECIDO */}
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                Zero lexical modification. Systems strictly maintain archaic grammar and literal spellings, fully bypassing modern ecumenical translations or standard market alterations.
              </p>
            </div>

            {/* PILLAR 3 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                03 / Dispensational Mechanics
              </h4>
              {/* 🖋️ TEXTO OSCURECIDO */}
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                Mathematical textual division. Complete algorithmic focus mapping out Biblical boundaries, structural typology, and specific target audience separation (Israel, Gentiles, and the Church of God).
              </p>
            </div>

            {/* PILLAR 4 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#000f37]">
                04 / Strict Cessationism
              </h4>
              {/* 🖋️ TEXTO OSCURECIDO */}
              <p className="text-sm leading-relaxed text-[#4b5563] text-left">
                Absolute defensive stance evaluating sign gifts under the strict completion of the Canon. Academic analysis running structural cross-references to expose contemporary charismatic vulnerabilities.
              </p>
            </div>

          </div>
        </section>

        {/* INTEGRATED PRICING SECTION */}
        <section className="border-t border-[#e5e7eb] pt-12 pb-8">
          {/* Subtítulo de sección oscurecido */}
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#4b5563] mb-8 font-serif">
            System Subscriptions & Access
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* PLAN GRATUITO: THE INQUIRER */}
            <div className="bg-white border border-[#e5e7eb] p-6 flex flex-col justify-between rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div>
                {/* Tag de plan oscurecido */}
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#4b5563] font-bold">
                  Initial Tier
                </span>
                <h4 className="text-base font-bold uppercase tracking-wide text-[#000f37] mt-1">
                  Free Use
                </h4>
                <div className="mt-4 flex items-baseline text-[#000f37]">
                  <span className="text-3xl font-bold tracking-tight">$0</span>
                  {/* Duración de plan oscurecido */}
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-[#4b5563]">/ forever</span>
                </div>
                
                {/* 🖋️ TEXTO OSCURECIDO */}
                <p className="mt-4 text-sm text-[#4b5563] leading-relaxed text-left">
                  Designed for casual examiners of the scriptures seeking to test the dogmatic precision of the Watchman framework.
                </p>

                {/* Checks de lista oscurecidos */}
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
              <div className="absolute top-0 right-0 bg-[#000f37] text-[#f9fafb] text-[8px] uppercase tracking-[0.2em] font-bold py-1 px-3 rounded-bl">
                Full Authority
              </div>

              <div>
                {/* Tag de plan oscurecido */}
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#4b5563] font-bold">
                  Complete Access
                </span>
                <h4 className="text-base font-bold uppercase tracking-wide text-[#000f37] mt-1">
                  The Watchman
                </h4>
                <div className="mt-4 flex items-baseline text-[#000f37]">
                  <span className="text-3xl font-bold tracking-tight">$7</span>
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-[#4b5563]">/ month</span>
                </div>
                
                {/* 🖋️ TEXTO OSCURECIDO */}
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
                  Upgrade to Watchman
                </a>
              </div>
            </div>

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