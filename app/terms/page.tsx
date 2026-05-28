// app/terms/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Patmos Research',
  description: 'Terms and conditions governing the use of Patmos Research platform.',
};

export default function TermsPage() {
  return (
    // Fondo claro sólido y tipografía Inter consistente con la landing
    <div className="min-h-screen bg-[#f9fafb] text-[#000f37] py-16 px-6 antialiased flex flex-col items-center" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Contenedor plano: sin sombra, sin bordes redondeados y sin stroke (border-none) */}
      <div className="w-full max-w-[700px] bg-white p-8 sm:p-12 rounded-none border-none">
        
        {/* ENCABEZADO */}
        <div className="mb-8 border-b border-[#000f37] pb-6">
          <Link href="/" className="text-xs font-bold text-[#000f37] uppercase tracking-wider hover:opacity-70 transition-opacity block mb-4 normal-case">
            ← Return to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tighter leading-tight text-[#000f37]">
            Terms of Service
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Last Updated: May 2026
          </p>
        </div>

        {/* CONTENIDO TEXTUAL */}
        <div className="space-y-6 text-[#374151] leading-relaxed text-sm sm:text-base">
          <p>
            Welcome to <strong>Patmos Research</strong> (accessible via patmosresearch.com). By accessing, browsing, or using our Scripture analysis platform, you explicitly agree to comply with and be legally bound by these Terms of Service.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            1. Nature of the Service
          </h2>
          <p>
            Patmos Research provides advanced artificial intelligence computational analysis toolsets tailored strictly for historical data correlation, textual synthesis, and inquiry over biblical manuscripts, primarily utilizing the Authorized King James Version (KJV). All services, streaming outputs, and query logs are provided on an "as is" and "as available" operational paradigm without warranties of any absolute kind.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            2. Subscription Tiers, Billing, and Rates
          </h2>
          <p>
            We offer a basic tiered access structure encompassing a rate-limited free utilization capability alongside an unconstrained premium service level ("PRO") priced at <strong>$7.00 USD per month</strong>. All monetary processing operations, checkout pipelines, and invoicing architectures are securely processed and managed under our dedicated secure subscription infrastructure.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            3. Account Integrity & Proper Utilization
          </h2>
          <p>
            You retain absolute exclusivity and total liability regarding the structural preservation, security, and usage credentials of your identity vault managed via our authentication mechanisms (Supabase Auth). Any attempt to systematically bypass inquiry velocity limits, script continuous automated parsing routines, scrape analytical data matrices, or inject malicious extraction prompts into the underlying large language pipelines will result in immediate and irrevocable permanent lifecycle termination of your profile.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            4. Amendments to Terms
          </h2>
          <p>
            Patmos Research reserves the unilateral right to amend these operative guidelines at any juncture. Continued interaction with the network following structural modifications establishes full automatic baseline validation of the updated terms.
          </p>
        </div>

      </div>
    </div>
  );
}