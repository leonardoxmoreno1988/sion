'use client';

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createBrowserClient } from '@supabase/ssr'; // Importado
import { useRouter } from 'next/navigation'; // Importado

export default function PatmosChat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null); // Estado para el usuario
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Welcome. How may I assist your Bible inquiry today?" 
    }
  ]);

  const router = useRouter();
  
  // Inicializamos el cliente de Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const theme = {
    bg: isDarkMode ? '#020617' : '#f9fafb',
    headerLine: isDarkMode ? '#1e293b' : '#1f2937',
    textMain: isDarkMode ? '#f1f5f9' : '#111827',
    textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
    bubbleUser: isDarkMode ? '#273c5a' : '#1f2937',
    bubbleSion: isDarkMode ? '#0f172a' : '#fff',
    borderSion: isDarkMode ? '#1e293b' : '#e5e7eb',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputText: isDarkMode ? '#f8fafc' : '#111827',
    fontSans: '"Inter", sans-serif',
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Carga de la fuente Inter y obtención del usuario
    const initPage = async () => {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? 'Vigilante');

      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
      }
    };

    initPage();
    scrollToBottom();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = isDarkMode ? '#020617' : '#f9fafb';
  }, [isDarkMode]);

  // Función de Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "An error occurred.");
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `System Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: theme.bg,
      fontFamily: 'serif',
      alignItems: 'center',
      padding: '0 20px',
      transition: 'background-color 0.4s ease' 
    }}>
      {/* Header Modificado con User & Logout */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1.5px solid ${theme.headerLine}`,
        padding: '20px 0',
        marginBottom: '10px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            margin: 0, 
            letterSpacing: '1px',
            color: theme.textMain
          }}>
            PATMOS
          </h1>
          {userEmail && (
            <p style={{ 
              fontSize: '9px', 
              color: theme.textMuted, 
              margin: '2px 0 0 0',
              fontFamily: theme.fontSans,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Station: {userEmail}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Botón de Dark Mode */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}
            title="Toggle theme"
          >
            {isDarkMode ? '☼' : '☾'}
          </button>

          {/* Botón de Logout */}
          <button 
            onClick={handleLogout}
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: theme.textMain,
              background: 'transparent',
              border: `1px solid ${theme.textMain}`,
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: theme.fontSans,
              textTransform: 'uppercase'
            }}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '600px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px 0'
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '90%',
              padding: '12px 20px',
              borderRadius: m.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
              fontSize: '15px',
              lineHeight: '1.6',
              fontFamily: theme.fontSans,
              backgroundColor: m.role === 'user' ? theme.bubbleUser : theme.bubbleSion,
              color: m.role === 'user' ? '#fff' : theme.textMain,
              border: m.role === 'user' ? 'none' : `1px solid ${theme.borderSion}`,
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.3s ease'
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ color: theme.textMuted, fontSize: '14px', fontStyle: 'italic', marginLeft: '10px', fontFamily: theme.fontSans }}>
              Examining the scriptures...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ width: '100%', maxWidth: '600px', padding: '20px 0 40px 0' }}>
        <form onSubmit={sendMessage} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            style={{
              width: '100%',
              padding: '16px 60px 16px 25px',
              borderRadius: '30px',
              border: `1px solid ${isDarkMode ? '#334155' : '#9ca3af'}`,
              fontSize: '15px',
              outline: 'none',
              backgroundColor: theme.inputBg,
              color: theme.inputText,
              fontFamily: theme.fontSans,
              transition: 'all 0.3s ease'
            }}
            placeholder="Search the scriptures..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading}
            style={{
              position: 'absolute',
              right: '10px',
              backgroundColor: isLoading ? '#475569' : theme.textMain,
              color: isDarkMode ? '#020617' : '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            →
          </button>
        </form>
        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: theme.textMuted,
          marginTop: '15px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontFamily: 'serif',
        }}>
          Based on Rightly Dividing the Word of Truth
        </p>
      </div>
    </main>
  );
}