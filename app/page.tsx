'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
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
      
      {/* HEADER */}
      <header className="w-full max-w-[700px] py-6 flex justify-between items-center mt-4">
        <span 
          className="text-xl uppercase text-[#000f37]" 
          style={{ fontFamily: 'Georgia, serif', fontWeight: 300, letterSpacing: '4px' }}
        >
          PATMOS
        </span>
        <Link 
          href="/login" 
          className="text-xs font-bold uppercase tracking-wider border border-[#000f37] text-[#000f37] px-4 py-2 rounded-none transition-all duration-300 hover:bg-[#000f37] hover:text-[#f9fafb]"
        >
          Sign In
        </Link>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 w-full max-w-[700px] flex flex-col justify-center py-16">
        <div className="mb-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight text-[#000f37]">
            The KJV Bible<br/>at Your Command
          </h1>
        </div>

        <p className="text-2xl font-medium text-[#000f37] max-w-xl">
          An AI assistant built exclusively on the <span className="font-semibold">Authorized King James Version</span>.
        </p>

        <p className="text-lg leading-relaxed text-[#374151] mt-6 max-w-2xl">
          Defends the literal, dispensational, pre-tribulational teaching of Scripture.<br/>
          No modern translations. No human authors. No compromise.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#000f37] text-[#f9fafb] text-base font-semibold px-10 py-5 rounded-xl hover:bg-black transition-all"
          >
            Start Asking the KJV Now →
          </Link>
        </div>

        {/* 🛠️ AJUSTE: Oferta reducida a 15 preguntas en el subtítulo del Hero */}
        <p className="text-sm text-gray-500 mt-4">
          Free: 15 questions per day • Pro: Unlimited for $7/month
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
            Built Exclusively for KJV-Only Believers
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div>
              <h4 className="font-semibold text-lg">KJV Only</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                Every answer is drawn directly and exclusively from the Authorized King James Version.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">Firm Pre-Trib Stance</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                Defends the literal teaching of the Rapture before the Tribulation and the 70th Week of Daniel.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">No Human Opinions</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                No commentaries, no authors, no modern interpretations — only the pure Word of God.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">Rightly Dividing the Word</h4>
              <p className="text-[#4b5563] mt-3 leading-relaxed">
                Designed to uphold the dispensational distinction between Israel and the Church.
              </p>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="mt-20 border-t border-[#e5e7eb] pt-12">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8">
            Choose Your Access
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Free Plan */}
            <div className="bg-white border border-[#cbd5e1] p-8 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-semibold">Free</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="ml-2 text-gray-500">/ forever</span>
                </div>
                <p className="mt-6 text-[#4b5563]">
                  Perfect for testing and daily use.
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {/* 🛠️ AJUSTE: Límitación explícita a 15 preguntas en la viñeta del Plan Gratuito */}
                  <li className="flex items-center gap-2">✓ 15 questions per day</li>
                  <li className="flex items-center gap-2">✓ Full KJV answers</li>
                  <li className="flex items-center gap-2">✓ Pre-trib defense</li>
                </ul>
              </div>
              <Link 
                href="/login"
                className="block w-full text-center mt-10 border border-[#000f37] py-4 font-semibold rounded-xl hover:bg-gray-50"
              >
                Start Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-[#000f37] p-8 rounded-xl relative flex flex-col justify-between">
              <div className="absolute -top-3 right-6 bg-[#2d65f6] text-white text-xs px-4 py-1 rounded-full font-medium">
                RECOMMENDED
              </div>
              
              <div>
                <h4 className="text-xl font-semibold">Become a Supporter</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold">$7</span>
                  <span className="ml-2 text-gray-500">/ month</span>
                </div>
                <p className="text-sm text-gray-500">or $69/year (save 18%)</p>
                
                <p className="mt-4 text-xs italic leading-relaxed text-[#4b5563]">
                  "Your support helps keep Patmos pure, independent, and focused only on the KJV for believers around the world."
                </p>
                
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-center gap-2">✓ Unlimited questions</li>
                  <li className="flex items-center gap-2">✓ Faster responses</li>
                  <li className="flex items-center gap-2">✓ Full conversation history</li>
                  <li className="flex items-center gap-2">✓ Priority access</li>
                </ul>
              </div>
              <a 
                href="/api/checkout"
                className="block w-full text-center mt-10 bg-[#000f37] text-white py-4 font-semibold rounded-xl hover:bg-black"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>
        </section>

        {/* FAQS */}
        <section className="mt-20 border-t border-[#e5e7eb] pt-12 pb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8">
            Frequently Examined
          </h3>

          <div className="flex flex-col border-b border-[#e5e7eb]">
            
            {/* PREGUNTA 1 */}
            <details className="group py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  Does Patmos remain strictly anchored to the Textus Receptus lineage?
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Yes. Patmos maps out strict biblical context utilizing exclusively the Textus Receptus lineage through the authorized King James Version (KJV), ensuring zero modern lexical modification or ecumenical alterations.
              </p>
            </details>

            {/* PREGUNTA 2 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  How does the architecture enforce the right division of truth?
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Every prompt execution runs through native algorithmic filters that align data structures with right division metrics, rigidly partitioning target audiences, structural typology, and dispensational boundaries.
              </p>
            </details>

            {/* PREGUNTA 3 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  What happens once my daily quota of scriptural inquiries is exhausted?
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              {/* 🛠️ AJUSTE: Sincronizada la respuesta de la FAQ con el nuevo límite de 15 preguntas */}
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Once the 15 daily question barrier is reached, the pipeline locks automatically to protect computational resources. You can sustain unhindered and uncapped pipeline access by becoming a Supporter at any time.
              </p>
            </details>

            {/* PREGUNTA 4 */}
            <details className="group border-t border-[#e5e7eb] py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-[#000f37]">
                <h4 className="text-base font-semibold tracking-wide text-left">
                  Can I manage my supporter contribution and archiving preferences dynamically?
                </h4>
                <svg 
                  className="size-4 text-[#4b5563] group-open:-rotate-180 transition-transform duration-300 ease-in-out shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5563] pr-6 transition-all duration-300">
                Yes. Supporter accounts gain immediate access to a secure Stripe Customer Portal integrated right into the interface header to alter credentials, manage continuous archiving, or adjust tiers.
              </p>
            </details>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-[700px] border-t border-[#e5e7eb] py-8 flex justify-center items-center">
        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider text-center">
          © {new Date().getFullYear()} Patmos Research. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}