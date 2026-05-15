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
      router.push('/chat');
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email to confirm the registry.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f9fafb] relative overflow-hidden text-black">
      
      {/* SECCIÓN IZQUIERDA: CONTENEDOR DE LA IMAGEN */}
      <div className="absolute inset-0 md:relative md:w-1/2 h-full bg-[#f3f4f6] bg-cover bg-center">
        {/* Usamos una imagen HTML nativa optimizada por CSS para evitar conflictos de comillas en Turbopack */}
        <img 
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200" 
          alt="Archive Ornament" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Capa de contraste para móvil */}
        <div className="absolute inset-0 bg-white/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none" />
      </div>

      {/* SECCIÓN DERECHA: CAJA DE LOGIN */}
      <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-20">
        <div className="w-full max-w-[400px] space-y-8 border border-black/5 bg-white/95 md:bg-white p-10 shadow-xl md:shadow-none backdrop-blur-md md:backdrop-blur-none rounded-xl md:rounded-none">
          
          {/* Cabecera Solemne */}
          <div className="text-center">
            <h1 className="text-4xl font-light tracking-[0.25em] text-black font-serif">
               PATMOS
            </h1>
            <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-black/20 to-transparent" />
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gray-400">
              The Watchman of Final Authority
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-b border-black/10 bg-transparent py-3 text-sm text-black outline-none focus:border-black/50 transition-colors placeholder:text-gray-300 tracking-wider"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="PASSWORD"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b border-black/10 bg-transparent py-3 text-sm text-black outline-none focus:border-black/50 transition-colors placeholder:text-gray-300 tracking-wider"
                />
              </div>
            </div>

            {/* Mensajes de Alerta */}
            {message && (
              <div className="bg-black/5 border border-black/10 py-2 text-[10px] text-black text-center uppercase tracking-widest leading-relaxed px-2 font-medium">
                {message}
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex flex-col gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? 'AUTHENTICATING...' : 'ACCESS THE ARCHIVE'}
              </button>
              
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="text-[9px] uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors disabled:opacity-30 font-medium"
              >
                Request New Registry
              </button>
            </div>
          </form>

          {/* Cita */}
          <footer className="pt-8 text-center">
            <p className="text-[10px] italic text-gray-500 font-serif leading-relaxed">
              "Procura con diligencia presentarte a Dios aprobado, como obrero que no tiene de qué avergonzarse..."
            </p>
          </footer>
        </div>
      </div>

    </div>
  );
}