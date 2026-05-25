'use client';

// 🚀 Cambiado a Alias Absoluto para blindar el build de Vercel
import { useLanguage } from "../app/context/Languagecontext";

export default function Header() {
  const { lang, t, setLanguage } = useLanguage();

  return (
    <header className="flex justify-between items-center p-4 bg-zinc-950 border-b border-zinc-800">
      {/* Título adaptativo */}
      <h1 className="text-xl font-bold text-zinc-100 tracking-wider">
        {t.header.title}
      </h1>

      <div className="flex items-center gap-4">
        {/* Selector de Idioma */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-1 text-xs">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded transition-all ${
              lang === 'en' 
                ? 'bg-zinc-700 text-zinc-100 font-bold' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('es')}
            className={`px-2 py-1 rounded transition-all ${
              lang === 'es' 
                ? 'bg-zinc-700 text-zinc-100 font-bold' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ES
          </button>
        </div>

        {/* Botón de Upgrade */}
        <button className="bg-zinc-100 text-zinc-950 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-all">
          {t.header.upgrade}
        </button>
      </div>
    </header>
  );
}