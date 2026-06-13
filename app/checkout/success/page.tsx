'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function SuccessPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let realtimeChannel: any = null;

    const verifySessionAndListen = async () => {
      // 1. Obtener el usuario autenticado actual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Si no hay sesión, no podemos verificar en tiempo real, se queda el texto estático
        return;
      }

      const userId = session.user.id;
      setUserEmail(session.user.email ?? null);

      // 2. Hacer una verificación rápida inicial por si el webhook ya impactó
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (subscription?.status === 'active' || subscription?.status === 'trialing') {
        setIsVerified(true);
        // Redirección automatizada rápida después de 3 segundos
        setTimeout(() => router.push('/chat'), 3000);
        return;
      }

      // 3. Si aún no es activo, abrimos el canal Realtime para capturar el instante exacto del Webhook
      realtimeChannel = supabase
        .channel(`success_page_verification:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Escucha tanto INSERT como UPDATE por seguridad
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            const status = payload.new?.status;
            if (status === 'active' || status === 'trialing') {
              setIsVerified(true);
              console.log('⚡ ¡Cuenta ascendida a PRO en tiempo real!');
              setTimeout(() => router.push('/chat'), 3000);
            }
          }
        )
        .subscribe();
    };

    verifySessionAndListen();

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#000f37] flex flex-col items-center justify-center antialiased px-6 text-center" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div className="max-w-md bg-white p-8 rounded-none">
        
        {/* 🔄 ICONO DINÁMICO */}
        {!isVerified ? (
          // Icono de Reloj animado (Esperando sincronización del ledger)
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#e0e7ff] mb-6 animate-pulse">
            <svg className="h-6 w-6 text-[#2d65f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : (
          // Check verde de éxito absoluto (Sincronizado)
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#dcfce7] mb-6 scale-110 transition-transform duration-300">
            <svg className="h-6 w-6 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight mb-3">
          {!isVerified ? 'Thank you for your support!' : 'Access Granted!'}
        </h1>
        
        {/* 📜 TEXTO DINÁMICO */}
        {!isVerified ? (
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Our ledger synchronization engine is currently verifying your transaction data. Your account access will be upgraded to <span className="font-semibold text-[#000f37]">PRO</span> automatically within the next few moments.
          </p>
        ) : (
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Your transaction has been securely processed and verified. Your account {userEmail && <span className="font-mono text-xs block my-1 text-gray-500">{userEmail}</span>} is now fully upgraded to <span className="font-bold text-[#2d65f6]">PRO</span>. Redirecting you to the engine...
          </p>
        )}

        <div className="border-t border-gray-100 pt-6">
          <Link 
            href="/chat" 
            className="block w-full text-center bg-[#000f37] text-white text-sm font-semibold py-3 px-6 rounded-xl hover:bg-black transition-all"
          >
            {!isVerified ? 'Return to Patmos Engine' : 'Go to Chat Now →'}
          </Link>
        </div>
      </div>
    </div>
  );
}