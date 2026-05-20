// app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  created_at: string;
  user_query: string;
  bot_response: string;
  metadata?: {
    source?: string;
  };
}

export default function PatmosChat() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // 🔒 ESTADOS: Control del Paywall automático y ciclo de vida de Stripe
  const [hasCredits, setHasCredits] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: "Welcome. How may I assist your Bible inquiry today?" }
  ]);
  const [customInput, setCustomInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🎨 CONFIGURACIÓN DE BRANDING: Actualizado con el nuevo gris premium #4b5563
  const theme = {
    bg: isDarkMode ? '#020617' : '#f9fafb',
    sidebarBg: isDarkMode ? '#090d16' : '#f3f4f6',
    headerLine: isDarkMode ? '#1e293b' : '#000f37',
    textMain: isDarkMode ? '#f1f5f9' : '#000f37',
    textMuted: isDarkMode ? '#94a3b8' : '#4b5563', // 🖋️ CAMBIO: De #6b7280 a #4b5563 para cuerpos de texto
    bubbleUser: isDarkMode ? '#273c5a' : '#000f37',
    bubbleSion: isDarkMode ? '#0f172a' : '#fff',
    borderSion: isDarkMode ? '#1e293b' : '#e5e7eb',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputText: isDarkMode ? '#f8fafc' : '#000f37',
    fontSans: '"Inter", sans-serif',
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initPage = async () => {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/login');
        return;
      }

      setUserEmail(session.user.email ?? 'Vigilante');
      
      let currentHistory: ChatSession[] = [];
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          currentHistory = await res.json();
          setHistory(currentHistory);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }

      try {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (subscription) {
          const currentStatus = subscription.status;
          setSubscriptionStatus(currentStatus);

          if (currentStatus === 'active' || currentStatus === 'trialing') {
            setIsPremium(true);
            setHasCredits(true);
          } else if (currentStatus === 'past_due') {
            setIsPremium(false);
            setHasCredits(false);
            setMessages([
              { 
                id: 'system-past-due', 
                role: 'assistant', 
                content: "⚠️ **Subscription Alert:** Your recent renewal invoice settlement failed. Access has been temporarily restricted. Please visit the **Billing** portal above to update your payment method." 
              }
            ]);
          } else {
            setIsPremium(false);
            setHasCredits(currentHistory.length < 5);
          }
        } else {
          setIsPremium(false);
          setHasCredits(currentHistory.length < 5);
        }
      } catch (subErr) {
        console.error("Error checking subscription tier:", subErr);
        setHasCredits(currentHistory.length < 5);
      }

      const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (event === 'SIGNED_OUT' || !currentSession) {
          router.push('/login');
        }
      });

      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
      }

      return () => {
        authSub.unsubscribe();
      };
    };
    initPage();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = isDarkMode ? '#020617' : '#f9fafb';
  }, [isDarkMode]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (!isPremium && subscriptionStatus !== 'past_due') {
          setHasCredits(data.length < 5);
        }
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const startNewInquiry = () => {
    setActiveSessionId(null);
    setMessages([
      { id: 'welcome', role: "assistant", content: "Welcome. How may I assist your Bible inquiry today?" }
    ]);
  };

  const loadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages([
      { id: `${session.id}-user`, role: "user", content: session.user_query },
      { id: `${session.id}-bot`, role: "assistant", content: session.bot_response }
    ]);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isLoading || !hasCredits) return;

    const userQuery = customInput;
    setCustomInput("");
    setIsLoading(true);

    const userMessageId = Math.random().toString();
    const assistantMessageId = Math.random().toString();
    
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { id: userMessageId, role: 'user', content: userQuery }
    ];
    
    setMessages(updatedMessages);
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: "" }
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) })
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to contact the Dogmatic Arsenal.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: accumulatedText } : m
            )
          );
        }
      }

      fetchHistory(); 

    } catch (error) {
      console.error("Patmos Pipeline Native Error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId 
            ? { ...m, content: "Aconteció un error en el flujo de transmisión del Arsenal." } 
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, transition: 'all 0.4s ease' }}>
      
      {/* SIDEBAR ARCHIVE */}
      <aside style={{
        width: sidebarOpen ? '260px' : '0px',
        backgroundColor: theme.sidebarBg,
        borderRight: sidebarOpen ? `1px solid ${theme.borderSion}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${theme.borderSion}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={startNewInquiry}
            style={{
              width: '100%',
              backgroundColor: theme.textMain,
              color: isDarkMode ? '#020617' : '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer',
              fontFamily: theme.fontSans
            }}
          >
            + New Inquiry
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '15px 10px' }}>
          {/* 🔍 TITULO: Sube de 9px a 11px */}
          <p style={{ fontSize: '11px', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '1.5px', paddingLeft: '10px', marginBottom: '12px', fontFamily: 'serif' }}>
            Historical Records
          </p>
          {history.length === 0 ? (
            <p style={{ fontSize: '11px', color: theme.textMuted, paddingLeft: '10px', fontStyle: 'italic', fontFamily: theme.fontSans }}>No records found.</p>
          ) : (
            history.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: activeSessionId === session.id ? (isDarkMode ? '#1e293b' : '#e5e7eb') : 'transparent',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'background 0.2s'
                }}
              >
                {/* 🔍 TEXTO DE LA INQUIRY: Sube de 12px a 14px */}
                <span style={{ 
                  fontSize: '14px', 
                  color: theme.textMain, 
                  fontWeight: '500', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  width: '100%',
                  fontFamily: theme.fontSans
                }}>
                  {session.user_query}
                </span>
                {/* 🔍 FECHA: Sube de 9px a 11px */}
                <span style={{ fontSize: '11px', color: theme.textMuted, fontFamily: theme.fontSans }}>
                  {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        alignItems: 'center',
        padding: '0 20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '650px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1.5px solid ${theme.headerLine}`,
          padding: '20px 0',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMain, fontSize: '18px', padding: 0 }}
              title="Toggle Archive"
            >
              ☰
            </button>
            <div>
              <h1 style={{ 
                fontSize: '18px', 
                textTransform: 'uppercase', 
                color: theme.textMain, 
                fontFamily: 'Georgia, serif', 
                fontWeight: 300, 
                letterSpacing: '4px',
                margin: 0 
              }}>
                PATMOS
              </h1>
              {userEmail && (
                /* 🔍 CORREO ELECTRONICO: Sube de 9px a 11px */
                <p style={{ 
                  fontSize: '11px', 
                  color: theme.textMuted, 
                  margin: '4px 0 0 0', 
                  fontFamily: theme.fontSans, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px' 
                }}>
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: theme.textMuted, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                transition: 'color 0.2s ease'
              }}
              title="Toggle Theme"
            >
              {isDarkMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              )}
            </button>

            {/* 🔒 📊 BOTÓN BILLING: Sincronizado para reflejar exactamente la misma firma visual y comportamiento interactivo de Exit */}
            {(isPremium || subscriptionStatus === 'past_due') && (
              <a 
                href="/api/portal"
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: subscriptionStatus === 'past_due' ? '#f87171' : theme.textMain,
                  textDecoration: 'none',
                  background: 'transparent',
                  border: `1px solid ${subscriptionStatus === 'past_due' ? '#f87171' : theme.textMain}`,
                  padding: '4px 8px',
                  fontFamily: theme.fontSans,
                  textTransform: 'uppercase',
                  transition: 'all 0.2s'
                }}
              >
                {subscriptionStatus === 'past_due' ? 'Fix Billing' : 'Billing'}
              </a>
            )}

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

        {/* Contenedor de Mensajes */}
        <div style={{
          flex: 1,
          width: '100%',
          maxWidth: '650px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '20px 0'
        }}>
          {messages.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p style={{ marginBottom: '16px', marginTop: '0px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ fontWeight: '700', color: 'inherit' }}>
                        {children}
                      </strong>
                    )
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

        {/* Caja de Input + Banner del Paywall Dinámico */}
        <div style={{ width: '100%', maxWidth: '650px', padding: '20px 0 40px 0' }}>
          
          {!hasCredits && (
            <div style={{
              display: 'flex',
              flexDirection: 'window' as any === 'undefined' || window.innerWidth < 640 ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: subscriptionStatus === 'past_due' ? (isDarkMode ? '#450a0a' : '#fef2f2') : (isDarkMode ? '#0f172a' : '#000f37'),
              color: subscriptionStatus === 'past_due' ? (isDarkMode ? '#fecaca' : '#991b1b') : '#f9fafb',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: `1px solid ${subscriptionStatus === 'past_due' ? '#ef4444' : (isDarkMode ? '#1e293b' : 'transparent')}`,
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ flex: 1 }}>
                <h5 style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1.5px', 
                  color: subscriptionStatus === 'past_due' ? '#ef4444' : (isDarkMode ? '#94a3b8' : '#cbd5e1'), 
                  margin: '0 0 4px 0', 
                  fontFamily: 'serif' 
                }}>
                  {subscriptionStatus === 'past_due' ? 'Payment Settlement Required' : 'Free Inquiry Limit Reached'}
                </h5>
                <p style={{ fontSize: '12px', color: subscriptionStatus === 'past_due' ? 'inherit' : '#cbd5e1', margin: 0, lineHeight: '1.4', fontFamily: theme.fontSans }}>
                  {subscriptionStatus === 'past_due' 
                    ? "Your station access is locked due to a failed renewal payment. Update your credit card credentials to resume pipeline access immediately."
                    : "Your manuscript pipeline allocation has concluded. Upgrade to sustain the architecture and execute unlimited Dogmatic inquiries."
                  }
                </p>
              </div>
              <a 
                href={subscriptionStatus === 'past_due' ? '/api/portal' : '/api/checkout'}
                style={{
                  backgroundColor: subscriptionStatus === 'past_due' ? '#ef4444' : '#fff',
                  color: subscriptionStatus === 'past_due' ? '#fff' : '#000f37',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: theme.fontSans,
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = subscriptionStatus === 'past_due' ? '#dc2626' : '#e2e8f0')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = subscriptionStatus === 'past_due' ? '#ef4444' : '#fff')}
              >
                {subscriptionStatus === 'past_due' ? 'Resolve Now &rarr;' : 'Upgrade &rarr;'}
              </a>
            </div>
          )}

          <form onSubmit={handleCustomSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              style={{
                width: '100%',
                padding: '16px 60px 16px 25px',
                borderRadius: '30px',
                border: `1px solid ${!hasCredits ? (isDarkMode ? '#7f1d1d' : '#fca5a5') : (isDarkMode ? '#334155' : '#000f3733')}`,
                fontSize: '15px',
                outline: 'none',
                backgroundColor: !hasCredits ? (isDarkMode ? '#450a0a20' : '#fef2f2') : theme.inputBg,
                color: !hasCredits ? '#94a3b8' : theme.inputText,
                fontFamily: theme.fontSans,
                transition: 'all 0.3s ease',
                cursor: !hasCredits ? 'not-allowed' : 'text'
              }}
              placeholder={hasCredits ? "Search the scriptures..." : (subscriptionStatus === 'past_due' ? "INQUIRY LOCKED — PAST DUE INVOICE" : "INQUIRY LOCKED — UPGRADE TO THE WATCHMAN TIER")}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)} 
              disabled={isLoading || !hasCredits}
            />
            <button 
              type="submit"
              disabled={isLoading || !hasCredits}
              style={{
                position: 'absolute',
                right: '10px',
                backgroundColor: (isLoading || !hasCredits) ? '#475569' : theme.textMain,
                color: isDarkMode ? '#020617' : '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: (isLoading || !hasCredits) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              →
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '11px', color: theme.textMuted, marginTop: '15px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'serif' }}>
            Based on Rightly Dividing the Word of Truth
          </p>
        </div>
      </main>
    </div>
  );
}