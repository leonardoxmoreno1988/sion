'use client';


import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr'; 
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const router = useRouter();

  // Inicializamos el cliente de navegador para manejar cookies automáticamente
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Forzamos el refresco para que el middleware lea la nueva cookie
      router.push('/chat');
      router.refresh();
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Verifica tu correo electrónico para confirmar el registro.');
    }
    setLoading(false);
  };

  // Reemplaza el bloque de retorno en app/login/page.tsx con este diseño pulido:

return (
  <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
    <div className="w-full max-w-[400px] space-y-8 border border-white/5 bg-[#0a0a0a] p-10 shadow-2xl">
      <div className="text-center">
        <h2 className="text-4xl font-light tracking-[0.25em] text-white font-serif">
          PATMOS
        </h2>
        <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gray-500">
          The Watchman of Final Authority
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-white/10 bg-transparent py-3 text-sm text-white outline-none focus:border-white/40 transition-colors placeholder:text-gray-700"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="PASSWORD"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-white/10 bg-transparent py-3 text-sm text-white outline-none focus:border-white/40 transition-colors placeholder:text-gray-700"
            />
          </div>
        </div>

        {message && (
          <div className="bg-red-900/10 border border-red-900/20 py-2 text-[10px] text-red-500 text-center uppercase tracking-widest">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-gray-200 disabled:opacity-30"
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS THE ARCHIVE'}
          </button>
          
          <button
            type="button"
            onClick={handleSignUp}
            className="text-[9px] uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
          >
            Request New Registry
          </button>
        </div>
      </form>

      <footer className="pt-8 text-center">
        <p className="text-[10px] italic text-gray-700 font-serif leading-relaxed">
          "Procura con diligencia presentarte a Dios aprobado..."
        </p>
      </footer>
    </div>
  </div>
);
}