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

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#0a0a0a] px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-4xl font-bold tracking-tighter text-white font-serif">
          PATMOS
        </h2>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-gray-500">
          The Watchman of Final Authority
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase text-gray-400">
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full border-0 bg-white/5 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-gray-500 sm:text-sm px-3 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase text-gray-400">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full border-0 bg-white/5 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-gray-500 sm:text-sm px-3 outline-none transition-all"
              />
            </div>
          </div>

          {message && (
            <div className="text-[10px] text-gray-400 border border-white/10 p-3 rounded bg-white/5 text-center leading-tight">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white px-3 py-2 text-sm font-bold text-black hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {loading ? 'PROCESSING...' : 'ENTER THE ARCHIVE'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full border border-white/20 px-3 py-2 text-sm font-bold text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              REGISTER
            </button>
          </div>
        </form>

        <p className="mt-12 text-center text-[10px] text-gray-600 italic font-serif">
          "Procura con diligencia presentarte a Dios aprobado, como obrero que no tiene de qué avergonzarse..."
        </p>
      </div>
    </div>
  );
}