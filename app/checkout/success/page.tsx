'use client';

import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#000f37] flex flex-col items-center justify-center antialiased px-6 text-center" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Contenedor plano: sin sombra, sin bordes redondeados (rounded-none) y sin borde/stroke */}
      <div className="max-w-md bg-white p-8 rounded-none">
        
        {/* Icono de Reloj / Sincronización */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#e0e7ff] mb-6">
          <svg className="h-6 w-6 text-[#2d65f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-3">
          Thank you for your support!
        </h1>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Our ledger synchronization engine is currently verifying your transaction data. Your account access will be upgraded to <span className="font-semibold text-[#000f37]">PRO</span> automatically within the next 10 to 15 minutes.
        </p>

        <div className="border-t border-gray-100 pt-6">
          {/* Botón: Mantiene el borde redondeado (rounded-xl) */}
          <Link 
            href="/chat" 
            className="block w-full text-center bg-[#000f37] text-white text-sm font-semibold py-3 px-6 rounded-xl hover:bg-black transition-all"
          >
            Return to Patmos Engine
          </Link>
        </div>
      </div>
    </div>
  );
}