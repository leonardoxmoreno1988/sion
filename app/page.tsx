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
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] flex flex-col items-center justify-between antialiased selection:bg-[#e5e7eb] px-6 md:px-0" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* MINIMALIST HEADER */}
      <header className="w-full max-w-[650px] border-b border-[#1f2937] py-6 flex justify-between items-center mt-4">
        <span className="text-lg font-bold tracking-wider uppercase text-[#111827]">
          PATMOS
        </span>
        <Link 
          href="/login" 
          className="text-xs font-bold uppercase tracking-wider border border-[#111827] px-4 py-2 transition-all duration-300 hover:bg-[#111827] hover:text-[#f9fafb]"
        >
          Access Station
        </Link>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 w-full max-w-[650px] flex flex-col justify-center py-16">
        <div className="border-l-2 border-[#1f2937] pl-6 mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-3 font-serif">
            The Watchman of Final Authority
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-[#111827] max-w-xl">
            Rigorous Theological Execution & Scripture Verification.
          </h2>
        </div>

        <p className="text-base leading-relaxed text-[#6b7280] text-left max-w-2xl mb-12">
          Patmos operates under absolute textual sovereignty. Designed for deep academic inquiry, the core system process extracts, dissects, and evaluates theological context utilizing strictly the Textus Receptus lineage through the **Reina Valera 1865** and the **King James Version (KJV)**. Every query is filtered under unwavering dispensational mechanics.
        </p>

        {/* PRIMARY CALL TO ACTION */}
        <div className="mb-16">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#111827] text-[#f9fafb] text-sm font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all duration-300 hover:bg-[#1f2937] shadow-sm"
          >
            Open the Repository &rarr;
          </Link>
        </div>

        {/* PRODUCT BENEFITS / SYSTEM PILLARS */}
        <section className="border-t border-[#e5e7eb] pt-12">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-8 font-serif">
            Core Architecture Pillars
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            
            {/* PILLAR 1 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#111827]">
                01 / Manuscript Database Integration
              </h4>
              <p className="text-xs leading-relaxed text-[#6b7280] text-left">
                High-fidelity data retrieval directly anchored to recovered textual fragments. Advanced source integrity controls eliminate general artificial intelligence neutrality, delivering dogmatic, absolute certainty.
              </p>
            </div>

            {/* PILLAR 2 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#111827]">
                02 / Textual Inerrancy
              </h4>
              <p className="text-xs leading-relaxed text-[#6b7280] text-left">
                Zero lexical modification. Systems strictly maintain archaic grammar and literal spellings (**"distinga"**, **"extendimiento"**), fully bypassing modern ecumenical translations or standard market alterations.
              </p>
            </div>

            {/* PILLAR 3 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#111827]">
                03 / Dispensational Mechanics
              </h4>
              <p className="text-xs leading-relaxed text-[#6b7280] text-left">
                Mathematical textual division. Complete algorithmic focus mapping out Biblical boundaries, structural typology, and specific target audience separation (Israel, Gentiles, and the Church of God).
              </p>
            </div>

            {/* PILLAR 4 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#111827]">
                04 / Strict Cessationism
              </h4>
              <p className="text-xs leading-relaxed text-[#6b7280] text-left">
                Absolute defensive stance evaluating sign gifts under the strict completion of the Canon. Academic analysis running structural cross-references to expose contemporary charismatic vulnerabilities.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-[650px] border-t border-[#e5e7eb] py-8 flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <p className="text-xs text-[#6b7280] tracking-widest uppercase font-serif text-center md:text-left">
          Based on Rightly Dividing the Word of Truth
        </p>
        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Patmos Research. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}