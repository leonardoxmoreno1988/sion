// app/privacy/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Patmos Research',
  description: 'Privacy rules and data handling procedures for Patmos Research.',
};

export default function PrivacyPage() {
  return (
    // Fondo claro sólido y tipografía Inter consistente con todo el ecosistema
    <div className="min-h-screen bg-[#f9fafb] text-[#000f37] py-16 px-6 antialiased flex flex-col items-center" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Contenedor plano: sin sombra, sin bordes redondeados y sin stroke (border-none) */}
      <div className="w-full max-w-[700px] bg-white p-8 sm:p-12 rounded-none border-none">
        
        {/* ENCABEZADO */}
        <div className="mb-8 border-b border-[#000f37] pb-6">
          <Link href="/" className="text-xs font-bold text-[#000f37] uppercase tracking-wider hover:opacity-70 transition-opacity block mb-4 normal-case">
            ← Return to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tighter leading-tight text-[#000f37]">
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Last Updated: May 2026
          </p>
        </div>

        {/* CONTENIDO TEXTUAL */}
        <div className="space-y-6 text-[#374151] leading-relaxed text-sm sm:text-base">
          <p>
            At <strong>Patmos Research</strong>, we hold an unyielding commitment to the computational protection and ethical containment of your personal identity parameters. This documentation clearly delineates how data inputs are isolated, persisted, and guarded.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            1. Information Accumulation Framework
          </h2>
          <p>
            During your operational enrollment protocol, we gather your explicit <strong>email address</strong> to anchor your authentication session profile managed entirely through isolated token instances via Supabase SSR Client architecture. We strictly <strong>do not capture, process, or log credit card numerical arrays, CVV signatures, or bank routing keys</strong> inside our native infrastructure databases. All transaction vectors are securely processed via tokenized methods within our dedicated secure subscription infrastructure.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            2. Core Data Utilization & Persistence
          </h2>
          <p>
            Your account profile variables are strictly mapped to provision your specific entitlement tier permissions and securely render your local <strong>historical inquiry session log registries</strong> inside the sidebar container. Chat records are encapsulated inside encrypted tables and are never leased, distributed, bartered, or propagated to any external corporate analytical aggregate or artificial intelligence model training queues.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            3. Cookies & Analytical Identifiers
          </h2>
          <p>
            We deploy secure, stateful server-side cookies strictly optimized to preserve authenticated runtime cycles, handle dynamic language context shifts (English/Spanish), and store secure cryptographic handshake nonces required by the underlying data pipeline.
          </p>
        </div>

      </div>
    </div>
  );
}