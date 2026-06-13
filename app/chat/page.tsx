'use client';

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from "../context/Languagecontext";

// Declaración para Lemon Squeezy Overlay
declare global {
  interface Window {
    LemonSqueezy: any;
  }
}

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
  const { t, lang, setLanguage } = useLanguage(); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [customInput, setCustomInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isMobile, setIsMobile] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // 🔒 ESTADOS: Control del Paywall sincronizado con estados HTTP
  const [hasCredits, setHasCredits] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const theme = {
    bg: isDarkMode ? '#020617' : '#f9fafb',
    sidebarBg: isDarkMode ? '#090d16' : '#f3f4f6',
    headerLine: isDarkMode ? '#1e293b' : '#000f37',
    textMain: isDarkMode ? '#f1f5f9' : '#000f37',
    textMuted: isDarkMode ? '#94a3b8' : '#4b5563', 
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
    if (messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome')) {
      setMessages([
        { 
          id: 'welcome', 
          role: 'assistant', 
          content: lang === 'es' ? "Bienvenido. ¿Cómo puedo asistir su investigación bíblica hoy?" : "Welcome. How may I assist your Bible inquiry today?" 
        }
      ]);
    }
  }, [lang]);

  useEffect(() => {
    // Declaramos la variable del canal afuera para poder desuscribirnos en la limpieza
    let realtimeChannel: any = null;

    const initPage = async () => {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const checkDevice = () => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        setSidebarOpen(!mobile);
      };

      checkDevice();
      window.addEventListener('resize', checkDevice);

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/login');
        return;
      }

      const emailSession = session.user.email ?? 'Vigilante';
      setUserEmail(emailSession);
      setUserId(session.user.id);

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

      // Función aislada para evaluar el estado de la suscripción de forma limpia
      const evaluateSubscriptionStatus = (status: string | null) => {
        setSubscriptionStatus(status);
        if (status === 'active' || status === 'trialing') {
          setIsPremium(true);
          setHasCredits(true);
        } else if (status === 'past_due' || status === 'paused') {
          setIsPremium(false);
          setHasCredits(false);
          setMessages([
            { 
              id: 'system-past-due', 
              role: 'assistant', 
              content: lang === 'es' 
                ? "⚠️ **Alerta de Suscripción:** Falló el pago de su factura de renovación o su cuenta está pausada. El acceso ha sido restringido temporalmente. Por favor, comuníquese con soporte para actualizar su método de pago."
                : "⚠️ **Subscription Alert:** Your recent renewal invoice settlement failed or your account is paused. Access has been temporarily restricted. Please contact support to update your payment method." 
            }
          ]);
        } else {
          setIsPremium(false);
          setHasCredits(true); 
        }
      };

      // 🛡️ COMPROBACIÓN INICIAL DEL BYPASS DE ADMINISTRADOR Y BASE DE DATOS
      if (emailSession === 'leonardo@ritualypropaganda.com') {
        setIsPremium(true);
        setHasCredits(true);
        setSubscriptionStatus('active');
      } else {
        try {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (subscription) {
            evaluateSubscriptionStatus(subscription.status);
          } else {
            setIsPremium(false);
            setHasCredits(true);
          }
        } catch (subErr) {
          console.error("Error checking subscription tier:", subErr);
          setHasCredits(true);
        }

        // 📡 ⚡ CONFIGURACIÓN DE SUPABASE REALTIME (Escucha Activa)
        // Se suscribe a cualquier UPDATE en la tabla 'subscriptions' que pertenezca a este usuario específico
        realtimeChannel = supabase
          .channel(`public:subscriptions:user_id=eq.${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'subscriptions',
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload) => {
              console.log('⚡ Cambio detectado en tiempo real en Supabase:', payload.new);
              const newStatus = payload.new.status;
              evaluateSubscriptionStatus(newStatus);
            }
          )
          .subscribe();
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

      // Retorno de limpieza (Cleanup) unificado
      return () => {
        authSub.unsubscribe();
        window.removeEventListener('resize', checkDevice);
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
        }
      };
    };

    // Variable para capturar la función de limpieza que devuelva initPage
    let cleanupFn: (() => void) | undefined;
    initPage().then(res => {
      if (typeof res === 'function') cleanupFn = res;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [lang]);

    // Cargar script de Lemon Squeezy para Overlay e inicializarlo
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    
    script.onload = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup();
      }
    };

    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[src="https://app.lemonsqueezy.com/js/lemon.js"]');
      if (existing) existing.remove();
    };
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
        
        if (userEmail === 'leonardo@ritualypropaganda.com') {
          setIsPremium(true);
          setHasCredits(true);
          setSubscriptionStatus('active');
        } else {
          setHasCredits(true); 
        }
        
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

    // 🍋 LEMON SQUEEZY OVERLAY - VERSIÓN ULTRA-FORZADA (Chat)
  const handleLemonSqueezyCheckout = () => {
    if (!userId) {
      alert(lang === 'es' ? "Error: Usuario no identificado" : "Error: User not identified");
      return;
    }

    const CHECKOUT_URL = `https://patmos.lemonsqueezy.com/checkout/buy/4beafe1a-6811-457e-b7b5-02e216f8aeef?checkout[custom][user_id]=${userId}&embed=1`;

    // 🎯 Forzado nativo: Usamos el método global directo si está disponible
    if (typeof window !== 'undefined' && window.LemonSqueezy?.Url) {
      window.LemonSqueezy.Url.open(CHECKOUT_URL);
    } else {
      // Respaldo inmediato si el script aún no termina de cargar de fondo
      window.open(CHECKOUT_URL, '_blank');
    }
  };

  // 📋 GESTIÓN DE FACTURACIÓN CON LEMON SQUEEZY (Versión Real de Producción)
const handleOpenBillingPortal = async (e: React.MouseEvent) => {
  e.preventDefault();
  
  if (!userId) {
    alert(lang === 'es' ? "Error: Usuario no identificado" : "Error: User not identified");
    return;
  }

  try {
    // Mostramos un feedback rápido en la misma alerta o puedes usar un estado de carga si prefieres
    console.log("Solicitando enlace al Customer Portal...");
    
    const res = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!res.ok) {
      throw new Error("No se pudo generar el enlace de facturación.");
    }

    const { url } = await res.json();

    if (url) {
      // 🚀 Abre el Customer Portal real de Lemon Squeezy en una pestaña nueva
      window.open(url, '_blank');
    } else {
      throw new Error("URL no recibida.");
    }

  } catch (err) {
    console.error("Error al abrir el portal de facturación:", err);
    alert(lang === 'es' 
      ? "No se pudo conectar con su perfil de facturación activo. Si es una cuenta promocional o de administración, el portal está desactivado." 
      : "Could not sync with your active billing profile. If this is a promotional or admin account, the portal is disabled."
    );
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
      { 
        id: 'welcome', 
        role: "assistant", 
        content: lang === 'es' ? "Bienvenido. ¿Cómo puedo asistir su investigación bíblica hoy?" : "Welcome. How may I assist your Bible inquiry today?" 
      }
    ]);
    if (isMobile) setSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages([
      { id: `${session.id}-user`, role: "user", content: session.user_query },
      { id: `${session.id}-bot`, role: "assistant", content: session.bot_response }
    ]);
    if (isMobile) setSidebarOpen(false);
  };

  const handleClearHistory = async () => {
    if (!isPremium) return;
    const confirmMessage = lang === 'es'
      ? "¿Está seguro de que desea purgar todos los archivos históricos continuos? Esta acción estructural es absoluta."
      : "Are you certain you want to purge all continuous historical archives? This structural action is absolute.";
      
    const confirmClear = window.confirm(confirmMessage);
    if (!confirmClear) return;
    
    setSettingsOpen(false);
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        setActiveSessionId(null); 
        setMessages([
          { 
            id: 'welcome', 
            role: 'assistant', 
            content: lang === 'es' ? "Bienvenido. ¿Cómo puedo asistir su investigación bíblica hoy?" : "Welcome. How may I assist your Bible inquiry today?" 
          }
        ]);
      } else {
        alert(lang === 'es' ? "Error al ejecutar la solicitud de purga." : "Failed to execute pipeline purge request.");
      }
    } catch (err) {
      console.error("Error executing historical purge pipeline:", err);
    }
  };

  const handleCopyText = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Could not copy manuscript response: ", err);
    }
  };

  const handlePrintMessage = (text: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '100%';
    iframe.style.bottom = '100%';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.write(`
      <html>
        <head>
          <title>Patmos Research - Scripture Inquiry</title>
          <style>
            body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.8; color: #000f37; padding: 2cm; font-size: 12pt; }
            p { margin-bottom: 1.5em; text-align: justify; white-space: pre-wrap; }
            strong { font-weight: 700; }
            .header { text-align: center; border-bottom: 2px solid #000f37; padding-bottom: 10px; margin-bottom: 30px; letter-spacing: 4px; }
            .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9pt; color: #4b5563; text-align: center; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="header">PATMOS RESEARCH</div>
          <div>${text.replace(/\n/g, '<br/>')}</div>
          <div class="footer">Based on Rightly Dividing the Word of Truth &copy; ${new Date().getFullYear()}</div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isLoading || !hasCredits) return;

    const userQuery = customInput.trim();
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

    let response: Response | undefined = undefined;

    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) })
      });

      if (response.status === 429) {
        setIsLoading(false); 
        setHasCredits(false); 
        setMessages((prev) => prev.filter(m => m.id !== assistantMessageId)); 
        return; 
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to contact the Dogmatic Engine.");
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

      await fetchHistory(); 

    } catch (error) {
      console.error("Patmos Pipeline Native Error:", error);
      
      if (response && response.status === 429) {
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId 
            ? { ...m, content: lang === 'es' ? "Aconteció un error en el flujo de transmisión del motor de investigación." : "An error occurred in the research engine transmission stream pipeline." } 
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: theme.bg, transition: 'all 0.4s ease', overflow: 'hidden' }}>
      
      {/* SIDEBAR ARCHIVE */}
      <aside style={{
        width: sidebarOpen ? (isMobile ? '40%' : '260px') : '0px',
        flexShrink: 0,
        backgroundColor: theme.sidebarBg,
        borderRight: sidebarOpen ? `1px solid ${theme.borderSion}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20
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
            {lang === 'es' ? "+ Nueva Consulta" : "+ New Inquiry"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '15px 6px' : '15px 10px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '10px', marginBottom: '12px', position: 'relative' }}>
            <p style={{ fontSize: isMobile ? '9px' : '11px', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '1.5px', paddingLeft: '10px', margin: 0, fontFamily: 'serif' }}>
              {lang === 'es' ? "Registros Históricos" : "Historical Records"}
            </p>
            
            {isPremium && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.textMuted,
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                  title={lang === 'es' ? "Preferencias del Archivo" : "Archive Preferences"}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>

                {settingsOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: 0,
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    border: `1px solid ${theme.borderSion}`,
                    borderRadius: '4px',
                    padding: '4px 0',
                    zIndex: 50,
                    width: '180px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={handleClearHistory}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontFamily: theme.fontSans,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#f3f4f6')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {lang === 'es' ? "Limpiar historial continuo" : "Clean historical record"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <p style={{ fontSize: '11px', color: theme.textMuted, paddingLeft: '10px', fontStyle: 'italic', fontFamily: theme.fontSans }}>
              {lang === 'es' ? "No se hallaron registros." : "No records found."}
            </p>
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
                  padding: isMobile ? '8px 6px' : '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'background 0.2s'
                }}
              >
                <span style={{ 
                  fontSize: isMobile ? '12px' : '13px', 
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
                <span style={{ fontSize: isMobile ? '10px' : '11px', color: theme.textMuted, fontFamily: theme.fontSans }}>
                  {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main style={{
        width: isMobile ? (sidebarOpen ? '60%' : '100%') : '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 20px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10
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
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMain, fontSize: '18px', padding: 0 }}
              title="Toggle Archive"
            >
              ☰
            </button>
            <div className="flex flex-col">
              <Link href="/" className="transition-opacity duration-200 hover:opacity-80 block align-middle">
                <img 
                  src="https://www.leonardoxmoreno.com/files/logo-patmos.svg" 
                  alt="Patmos Research Logo" 
                  className="h-3.5 w-auto object-contain text-left"
                  style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }}
                />
              </Link>
              {userEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 0 0' }}>
                  <p style={{ 
                    fontSize: '11px', 
                    color: theme.textMuted, 
                    margin: 0, 
                    fontFamily: theme.fontSans, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    maxWidth: isMobile ? '100px' : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {userEmail}
                  </p>
                  
                  {isPremium && (
                    <span style={{
                      backgroundColor: '#2d65f6',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      letterSpacing: '1px',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontFamily: theme.fontSans,
                      textTransform: 'uppercase',
                      userSelect: 'none',
                      lineHeight: '1'
                    }}>
                      PRO
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              )}
            </button>

            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              border: `1px solid ${theme.textMain}`,
              padding: '0 6px', 
              gap: '4px',
              backgroundColor: 'transparent',
              height: '24px', 
              boxSizing: 'border-box'
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={theme.textMain} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, display: 'block' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
              </svg>
              
              <select 
                value={lang}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                style={{
                  fontSize: '9px',
                  fontWeight: '700',
                  color: theme.textMain,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: theme.fontSans,
                  textTransform: 'uppercase',
                  padding: 0,
                  margin: 0,
                  lineHeight: '24px', 
                  height: '100%',
                  WebkitAppearance: 'none', 
                  MozAppearance: 'none'     
                }}
              >
                <option value="en" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: theme.textMain }}>EN</option>
                <option value="es" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: theme.textMain }}>ES</option>
              </select>
            </div>

            {(isPremium || subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') && (
              <button 
                onClick={handleOpenBillingPortal}
                style={{
                  display: 'inline-flex', 
                  alignItems: 'center',
                  fontSize: '9px',
                  fontWeight: '700',
                  color: (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#f87171' : theme.textMain,
                  background: 'transparent',
                  border: `1px solid ${(subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#f87171' : theme.textMain}`,
                  padding: '0 16px', 
                  height: '24px',  
                  boxSizing: 'border-box',
                  fontFamily: theme.fontSans,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {(subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? (lang === 'es' ? 'Corregir' : 'Fix') : (lang === 'es' ? 'Factura' : 'Bill')}
              </button>
            )}

            <button 
              onClick={handleLogout}
              style={{
                display: 'inline-flex', 
                alignItems: 'center',
                fontSize: '9px',
                fontWeight: '700',
                color: theme.textMain,
                background: 'transparent',
                border: `1px solid ${theme.textMain}`,
                padding: '0 6px', 
                height: '24px',  
                boxSizing: 'border-box',
                cursor: 'pointer',
                fontFamily: theme.fontSans,
                textTransform: 'uppercase'
              }}
            >
              {lang === 'es' ? "Salir" : "Exit"}
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
          gap: '24px',
          padding: '20px 0'
        }}>
          {messages.map((m) => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '90%',
                paddingTop: '12px',
                paddingRight: '20px',
                paddingBottom: '4px',
                paddingLeft: '20px',
                borderRadius: m.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                fontSize: isMobile ? '14px' : '15px',
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
                      <p style={{ margin: '0 0 12px 0', padding: 0, textAlign: 'left', whiteSpace: 'pre-wrap' }}>
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

              {m.role === 'assistant' && m.id !== 'welcome' && m.content.trim() !== "" && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '6px',
                  paddingLeft: '10px',
                  fontFamily: theme.fontSans,
                  fontSize: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <button
                    onClick={() => handleCopyText(m.id, m.content)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: copiedMessageId === m.id ? '#34a853' : theme.textMuted,
                      padding: 0,
                      outline: 'none',
                      fontSize: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'color 0.2s'
                    }}
                  >
                    {copiedMessageId === m.id ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>{lang === 'es' ? "Copiado" : "Copied"}</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <span>{lang === 'es' ? "Copiar" : "Copy"}</span>
                      </>
                    )}
                  </button>

                  <span style={{ color: theme.borderSion, userSelect: 'none' }}>|</span>

                  <button
                    onClick={() => handlePrintMessage(m.content)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.textMuted,
                      padding: 0,
                      outline: 'none',
                      fontSize: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = theme.textMain)}
                    onMouseOut={(e) => (e.currentTarget.style.color = theme.textMuted)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    <span>{lang === 'es' ? "Imprimir" : "Print"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ color: theme.textMuted, fontSize: '14px', fontStyle: 'italic', marginLeft: '10px', fontFamily: theme.fontSans }}>
                {lang === 'es' ? "Examinando las escrituras..." : "Examining the scriptures..."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Caja de Input + Banner del Paywall UNIFICADO A LEMON SQUEEZY */}
        <div style={{ width: '100%', maxWidth: '650px', padding: '20px 0 40px 0' }}>
          
          {!hasCredits && (
            <div style={{
              display: 'flex',
              flexDirection: typeof window === 'undefined' || window.innerWidth < 640 ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? (isDarkMode ? '#450a0a' : '#fef2f2') : (isDarkMode ? '#0f172a' : '#000f37'),
              color: (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? (isDarkMode ? '#fecaca' : '#991b1b') : '#f9fafb',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: `1px solid ${(subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#ef4444' : (isDarkMode ? '#1e293b' : 'transparent')}`,
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ flex: 1 }}>
                <h5 style={{ 
                  fontSize: '10px', 
                  fontWeight: '900', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1.5px', 
                  color: (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#ef4444' : (isDarkMode ? '#94a3b8' : '#cbd5e1'), 
                  margin: '0 0 4px 0', 
                  fontFamily: theme.fontSans 
                }}>
                  {(subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') 
                    ? (lang === 'es' ? 'Liquidación de Pago Requerida' : 'Payment Settlement Required') 
                    : (lang === 'es' ? 'Límite Gratuito Alcanzado' : 'Free Limit Reached')}
                </h5>
                <p style={{ fontSize: '12px', color: (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? 'inherit' : '#cbd5e1', margin: 0, lineHeight: '1.4', fontFamily: theme.fontSans }}>
                  {(subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') 
                    ? (lang === 'es' 
                        ? "Su acceso está bloqueado debido a un fallo en el pago de renovación. Actualice sus credenciales de tarjeta de crédito para reanudar el acceso de inmediato."
                        : "Your access is locked due to a failed renewal payment. Update your credit card credentials to resume access immediately.")
                    : (lang === 'es' 
                        ? "Ha alcanzado el límite de consultas gratuitas. Pase al nivel Pro para continuar su estudio bíblico y realizar búsquedas ilimitadas."
                        : "You have reached the limit of free searches. Upgrade to the Pro version to continue your Bible study and perform unlimited searches.")
                  }
                </p>
              </div>
              
              <button 
                onClick={handleLemonSqueezyCheckout}
                style={{
                  backgroundColor: (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#ef4444' : '#fff',
                  color: (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#fff' : '#000f37',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  fontFamily: theme.fontSans,
                  transition: 'background 0.2s',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#dc2626' : '#e2e8f0')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = (subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? '#ef4444' : '#fff')}
              >
                {(subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') ? (lang === 'es' ? 'Resolver Ahora →' : 'Resolve Now →') : (lang === 'es' ? 'Pasar a Pro →' : 'Upgrade →')}
              </button>
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
                color: !hasCredits ? '#7f8fa6' : theme.inputText,
                fontFamily: theme.fontSans,
                transition: 'all 0.3s ease',
                cursor: !hasCredits ? 'not-allowed' : 'text'
              }}
              placeholder={
                hasCredits 
                  ? (lang === 'es' ? "Escudriñad las escrituras..." : "Search the scriptures...") 
                  : ((subscriptionStatus === 'past_due' || subscriptionStatus === 'paused') 
                      ? (lang === 'es' ? "CONSULTA BLOQUEADA — FACTURA VENCIDA" : "INQUIRY LOCKED — PAST DUE INVOICE") 
                      : (lang === 'es' ? "PREGUNTAS AGOTADAS — ADQUIERA EL PLAN PRO" : "QUESTIONS ARE CLOSED — UPGRADE TO THE SUPPORTER PRO PLAN"))
              }
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
            {lang === 'es' ? "Basado en Administrar Bien la Palabra de Verdad" : "Based on Rightly Dividing the Word of Truth"}
          </p>
        </div>
      </main>
    </div>
  );
}