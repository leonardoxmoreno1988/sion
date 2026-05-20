// app/login/page.tsx
'use client';

import { useState, Suspense } from 'react'; // 🔒 CORRECCIÓN: Importamos Suspense
import { createBrowserClient } from '@supabase/ssr'; 
import { useRouter, useSearchParams } from 'next/navigation';

// 1. CREAMOS UN COMPONENTE INTERNO PARA EL FORMULARIO QUE CONTIENE EL LECTOR DE URL
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Captura dinámica del parámetro ?next=
  const nextRoute = searchParams.get('next') || '/chat';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    } else {
      router.push(nextRoute); 
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Email and password are required for registry.");
      return;
    }

    setLoading(true);
    setMessage(null);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextRoute}`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email to confirm the registry.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const redirectToUrl = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToUrl,
          queryParams: {
            next: nextRoute
          }
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage(`OAuth Error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
      <div className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b border-[#000f37]/10 bg-transparent py-3 text-sm text-[#000f37] outline-none focus:border-[#000f37]/50 transition-colors placeholder:text-gray-500 tracking-wider"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="PASSWORD"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-b border-[#000f37]/10 bg-transparent py-3 text-sm text-[#000f37] outline-none focus:border-[#000f37]/50 transition-colors placeholder:text-gray-500 tracking-wider"
          />
        </div>
      </div>

      {message && (
        <div className="bg-[#000f37]/5 border border-[#000f37]/10 py-2 text-[10px] text-[#000f37] text-center uppercase tracking-widest leading-relaxed px-2 font-medium rounded">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#000f37] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white rounded-lg transition-all hover:bg-[#000f37]/90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
        </button>

        <div className="flex items-center my-1">
          <div className="flex-1 h-[1px] bg-[#000f37]/10" />
          <span className="px-3 text-[9px] text-[#000f37]/60 tracking-widest font-bold uppercase">OR</span>
          <div className="flex-1 h-[1px] bg-[#000f37]/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-[#000f37]/10 bg-white py-3 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#000f37] rounded-lg transition-all hover:bg-gray-50 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.65-5.17 3.65-8.58z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 6.51l4.11 3.15c.94-2.85 3.57-4.91 6.68-4.91z"/>
          </svg>
          {loading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
        </button>
        
        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          className="text-[9px] uppercase tracking-[0.2em] text-gray-400 hover:text-[#000f37] transition-colors disabled:opacity-30 font-medium text-center mt-2"
        >
          Request New Registry
        </button>
      </div>
    </form>
  );
}

// 2. EXPORTACIÓN PRINCIPAL QUE ENVUELVE TODO EL CONTENEDOR VISUAL
export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-[#f9fafb] relative overflow-hidden text-[#000f37]">
      
      {/* SECCIÓN IZQUIERDA: CONTENEDOR CON TU IMAGEN DE FONDO PROPIA (PROVENIENTE DE TU HOSTING PERSONAL) */}
      <div 
        className="absolute inset-0 md:relative md:w-1/2 h-full bg-[#f3f4f6] bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://www.leonardoxmoreno.com/files/bg-patmos.jpg')` 
        }}
      >
        {/* 🔒 CAPA ALFA OSCURA AL 50% */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] md:backdrop-blur-none" />
      </div>

      {/* SECCIÓN DERECHA: CAJA DE LOGIN */}
      <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-20">
        <div className="w-full max-w-[400px] space-y-8 bg-white/95 md:bg-white p-10 shadow-xl md:shadow-none rounded-xl md:rounded-none">
          
          {/* Cabecera Solemne */}
          <div className="text-center">
            <h1 className="text-4xl font-light tracking-[0.25em] text-[#000f37] font-serif">
               PATMOS
            </h1>
            <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-[#000f37]/20 to-transparent" />
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gray-400">
              The Watchman of Final Authority
            </p>
          </div>

          {/* Formulario Reactivo */}
          <Suspense fallback={<div className="text-center py-4 text-xs tracking-widest text-gray-400 uppercase">Loading Session Parameters...</div>}>
            <LoginForm />
          </Suspense>

        </div>
      </div>

    </div>
  );
}