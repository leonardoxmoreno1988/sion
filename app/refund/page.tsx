// app/refund/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy | Patmos Research',
  description: 'Refund terms and continuous cancellation guidelines for Patmos Research subscriptions.',
};

export default function RefundPage() {
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
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Last Updated: May 2026
          </p>
        </div>

        {/* CONTENIDO TEXTUAL */}
        <div className="space-y-6 text-[#374151] leading-relaxed text-sm sm:text-base">
          <h2 className="text-lg font-semibold text-[#000f37]">
            1. Absolute Freedom of Cancellation
          </h2>
          <p>
            You retain absolute structural autonomy over your premium account level tier. You may request or execute a subscription cancellation at any precise moment by accessing your payment dashboard or contacting support.
          </p>
          <p>
            Following a cancellation event, your premium capabilities will not be hard-severed immediately; you will preserve unrestricted continuous access to the entire unlimited analysis engine layout until the final concluding second of your active, prepaid monthly operational cycle.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            2. Non-Refundable Nature of Active Cycles
          </h2>
          <p>
            Due to the immediate architectural allocation overhead and real-time transactional data costs required to execute complex model streaming loops, <strong>Patmos Research does not issue full or partial retroactive refunds</strong> for active subscription periods already billed.
          </p>

          <h2 className="text-lg font-semibold text-[#000f37] pt-4 border-t border-[#e5e7eb]">
            3. Exceptional Billing Incidents
          </h2>
          <p>
            If a double-charge or unintended duplicate transactional mutation occurs over your banking ledger due to a synchronization glitch on the network checkout, please immediately flag the issue via billing support. Verified anomalies will be fully credited back to your original transaction vehicle in an urgent manner.
          </p>
        </div>

      </div>
    </div>
  );
}