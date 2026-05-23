// app/login/page.tsx
'use client';

import { useState, Suspense } from 'react'; 
import { createBrowserClient } from '@supabase/ssr'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function LoginForm() {
  // 🔄 ESTADO DINÁMICO: false = Modo Sign In (Default) | true = Modo Sign Up
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get('next') || '/chat';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // GESTIÓN DE ENVÍO CENTRALIZADA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      // Flujo dedicado de Registro (Sign Up)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextRoute}` },
      });
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Check your email to confirm the registry.');
      }
      setLoading(false);
    } else {
      // Flujo dedicado de Autenticación (Sign In)
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
      } else {
        router.push(nextRoute); 
        router.refresh();
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const redirectToUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectToUrl, queryParams: { next: nextRoute } },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage(`OAuth Error: ${error.message}`);
      setLoading(false);
    }
  };

  // Alternar flujos limpiando mensajes previos
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setMessage(null);
  };

  return (
    <div>
      {/* 🏛️ CORRECCIÓN: Título dinámico alineado a la izquierda (text-left) */}
      <div className="text-left mt-6 px-1">
        <h2 className="text-xl font-bold tracking-wide text-[#000f37]">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h2>
      </div>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-[#000f37]/10 bg-transparent py-3 text-sm text-[#000f37] outline-none focus:border-[#000f37]/50 transition-colors placeholder:text-gray-400 tracking-wider rounded-none"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="PASSWORD"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-[#000f37]/10 bg-transparent py-3 text-sm text-[#000f37] outline-none focus:border-[#000f37]/50 transition-colors placeholder:text-gray-400 tracking-wider rounded-none"
            />
          </div>
        </div>

        {message && (
          <div className="bg-[#000f37]/5 border border-[#000f37]/10 py-2 text-[10px] text-[#000f37] text-center uppercase tracking-widest leading-relaxed px-2 font-medium rounded-none">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-4 pt-2">
          {/* 🔘 CORRECCIÓN: Botón Principal con ratio corner a 6px (rounded-[6px]) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#000f37] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white rounded-[6px] transition-all hover:bg-[#000f37]/90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'PROCESSING...' : (isSignUp ? 'SIGN UP' : 'SIGN IN')}
          </button>

          <div className="flex items-center my-1">
            <div className="flex-1 h-[1px] bg-[#000f37]/10" />
            <span className="px-3 text-[9px] text-[#000f37]/60 tracking-widest font-bold uppercase">OR</span>
            <div className="flex-1 h-[1px] bg-[#000f37]/10" />
          </div>

          {/* 🔘 CORRECCIÓN: Botón Google con ratio corner a 6px (rounded-[6px]) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-[#000f37]/10 bg-white py-3 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#000f37] rounded-[6px] transition-all hover:bg-gray-50 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.65-5.17 3.65-8.58z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 6.51l4.11 3.15c.94-2.85 3.57-4.91 6.68-4.91z"/>
            </svg>
            {loading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
          </button>
          
          {/* ENLACES DE CONMUTACIÓN */}
          <div className="text-center mt-3">
            {isSignUp ? (
              <p className="text-sm text-gray-400 font-medium tracking-wide">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-[#000f37] font-bold underline hover:no-underline bg-transparent border-none p-0 outline-none cursor-pointer ms-1"
                >
                  Sign in.
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-400 font-medium tracking-wide">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-[#000f37] font-bold underline hover:no-underline bg-transparent border-none p-0 outline-none cursor-pointer ms-1"
                >
                  Sign up.
                </button>
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f4f5f6] px-4 relative overflow-hidden text-[#000f37]">
      
      {/* 📦 CAJA DE LOGIN */}
      <div className="w-full max-w-[400px] bg-white p-10 border-none rounded-none shadow-none">
        
        {/* 🛠️ MODIFICADO: Bloque de marca con el isotipo SVG oficial centrado */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="transition-opacity duration-200 hover:opacity-80 block mb-1">
            <img 
              src="https://www.leonardoxmoreno.com/files/logo-patmos.svg" 
              alt="Patmos Research Logo" 
              className="h-10 w-auto object-contain mx-auto"
            />
          </Link>
          <div className="mt-3 h-[1px] w-full bg-gradient-to-r from-transparent via-[#000f37]/20 to-transparent" />
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gray-400">
            The Watchman of Final Authority
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-4 text-xs tracking-widest text-gray-400 uppercase">Loading...</div>}>
          <LoginForm />
        </Suspense>

      </div>

    </div>
  );
}