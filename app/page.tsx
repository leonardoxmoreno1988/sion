"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PatmosChat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Estado para el modo oscuro
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Welcome. How may I assist your Bible inquiry today?" 
    }
  ]);

  
  // Paleta de colores dinámica
  const theme = {
    bg: isDarkMode ? '#020617' : '#f9fafb',        // Slate 950 : Gray 50
    headerLine: isDarkMode ? '#1e293b' : '#1f2937',
    textMain: isDarkMode ? '#f1f5f9' : '#111827',
    textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
    bubbleUser: isDarkMode ? '#273c5a' : '#1f2937', // Slate 700 : Gray 800
    bubbleSion: isDarkMode ? '#0f172a' : '#fff',    // Slate 900 : White
    borderSion: isDarkMode ? '#1e293b' : '#e5e7eb',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputText: isDarkMode ? '#f8fafc' : '#111827',
    fontSans: '"Inter", sans-serif', // Nueva variable para Inter
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Carga de la fuente Inter
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Detectar si el sistema del usuario prefiere modo oscuro
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
    }
    scrollToBottom();
  }, []);

  // Actualizar el localStorage cada vez que cambies el tema
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    if (isDarkMode) {
      document.body.style.backgroundColor = '#020617'; 
    } else {
      document.body.style.backgroundColor = '#f9fafb'; 
    }
  }, [isDarkMode]);

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
    }
  };

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: theme.bg,
      fontFamily: 'serif', // Mantiene serif para la estructura base
      alignItems: 'center',
      padding: '0 20px',
      transition: 'background-color 0.4s ease' 
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1.5px solid ${theme.headerLine}`,
        padding: '30px 0',
        marginBottom: '10px'
      }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          margin: 0, 
          letterSpacing: '1px',
          color: theme.textMain
        }}>
          PATMOS <span style={{ color: theme.textMuted, fontWeight: '300' }}>/ BIBLE RESEARCH</span>
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              color: theme.textMuted, 
              transition: 'color 0.3s ease'
            }}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          <div style={{ 
            fontSize: '10px', 
            color: theme.textMain, 
            fontWeight: '700',
            textTransform: 'uppercase',
            border: `1px solid ${theme.textMain}`,
            padding: '2px 6px',
            fontFamily: theme.fontSans // Inter para el badge
          }}>
            KJV / Authorized Version
          </div>
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
              fontSize: '15px', // Ajustado ligeramente para Inter
              lineHeight: '1.6',
              fontFamily: theme.fontSans, // Inter aplicado aquí
              backgroundColor: m.role === 'user' ? theme.bubbleUser : theme.bubbleSion,
              color: m.role === 'user' ? '#fff' : theme.textMain,
              border: m.role === 'user' ? 'none' : `1px solid ${theme.borderSion}`,
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.3s ease'
            }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}: any) => {
                    const isLast = node?.position?.end.offset === m.content.length;
                    return (
                      <p style={{ margin: 0, padding: 0, marginBottom: isLast ? '0px' : '1em' }} {...props} />
                    );
                  }
                }}
              >
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
              fontFamily: theme.fontSans, // Inter aplicado aquí
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