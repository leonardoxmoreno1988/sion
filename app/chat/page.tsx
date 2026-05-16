'use client';

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Welcome. How may I assist your Bible inquiry today?" 
    }
  ]);

  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const theme = {
    bg: isDarkMode ? '#020617' : '#f9fafb',
    sidebarBg: isDarkMode ? '#090d16' : '#f3f4f6',
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
    const initPage = async () => {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? 'Vigilante');
        fetchHistory(); 
      }

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

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
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
      { role: "assistant", content: "Welcome. How may I assist your Bible inquiry today?" }
    ]);
  };

  const loadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages([
      { role: "user", content: session.user_query },
      { role: "assistant", content: session.bot_response }
    ]);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = input; 
    setInput("");
    setIsLoading(true);

    try {
      let contextText = "";

      // 1. CAPTURA Y PARSEO UNIVERSAL DE CITAS BÍBLICAS
      const match = currentInput.match(/(\d?\s*[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*(\d+):(\d+)/);
      
      if (match) {
        const rawBook = match[1].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const chapterNum = parseInt(match[2], 10);
        const verseNum = parseInt(match[3], 10);

        // Diccionario de traducción estricto para emparejar el input en español con tu columna JSONB (en inglés)
        const bibleBooksIndex: Record<string, string> = {
          "genesis": "Genesis", "exodo": "Exodus", "levitico": "Leviticus", "numeros": "Numbers",
          "deuteronomio": "Deuteronomy", "josue": "Joshua", "jueces": "Judges", "rut": "Ruth",
          "1 samuel": "1 Samuel", "2 samuel": "2 Samuel", "i samuel": "1 Samuel", "ii samuel": "2 Samuel",
          "1 reyes": "1 Kings", "2 reyes": "2 Kings", "i reyes": "1 Kings", "ii reyes": "2 Kings",
          "1 cronicas": "1 Chronicles", "2 cronicas": "2 Chronicles", "i cronicas": "1 Chronicles", "ii cronicas": "2 Chronicles",
          "esdras": "Ezra", "nehemias": "Nehemiah", "ester": "Esther", "job": "Job", "salmos": "Psalms", "proverbios": "Proverbs",
          "eclesiastes": "Ecclesiastes", "cantares": "Song of Solomon", "isaias": "Isaiah",
          "jeremias": "Jeremiah", "lamentaciones": "Lamentations", "ezequiel": "Ezekiel", "daniel": "Daniel",
          "oseas": "Hosea", "joel": "Joel", "amos": "Amos", "abdias": "Obadiah", "jonas": "Jonah",
          "miqueas": "Micah", "nahum": "Nahum", "habacuc": "Habakuk", "sofonias": "Zephaniah",
          "hageo": "Haggai", "zacarias": "Zechariah", "malaquias": "Malachi",
          "mateo": "Matthew", "marcos": "Mark", "lucas": "Luke", "juan": "John", "hechos": "Acts",
          "romanos": "Romans", "1 corintios": "1 Corinthians", "2 corintios": "2 Corinthians",
          "i corintios": "1 Corinthians", "ii corintios": "2 Corinthians",
          "galatas": "Galatians", "efesios": "Ephesians", "filipenses": "Philippians", "colosenses": "Colossians",
          "1 tesalonicenses": "1 Thessalonians", "2 tesalonicenses": "2 Thessalonians",
          "i tesalonicenses": "1 Thessalonians", "ii tesalonicenses": "2 Thessalonians",
          "1 timoteo": "1 Timothy", "2 timoteo": "2 Timothy", "1 timothy": "1 Timothy", "2 timothy": "2 Timothy", "timoteo": "1 Timothy",
          "i timoteo": "1 Timothy", "ii timoteo": "2 Timothy",
          "tito": "Titus", "filemon": "Philemon", "hebreos": "Hebrews", "santiago": "James",
          "1 pedro": "1 Peter", "2 pedro": "2 Peter", "i pedro": "1 Peter", "ii pedro": "2 Peter",
          "1 juan": "1 John", "2 juan": "2 John", "3 juan": "3 John", "i juan": "1 John", "ii juan": "2 John", "iii juan": "3 John",
          "judas": "Jude", "apocalipsis": "Revelation", "revelacion": "Revelation"
        };

        const bookSearch = bibleBooksIndex[rawBook] || match[1].trim();

        // CONSULTA DE PRECISIÓN ABSOLUTA PARA ENTEROS NATIVOS
        const { data: exactVerses, error: dbError } = await supabase
          .from('documents')
          .select('content, metadata')
          .eq('metadata->>book', bookSearch)
          .contains('metadata', { chapter: chapterNum, verse: verseNum });

        if (!dbError && exactVerses && exactVerses.length > 0) {
          const filtered = exactVerses.filter(f => f.metadata?.version === 'RV1865');
          if (filtered.length > 0) {
            contextText = filtered.map(f => f.content).join("\n\n");
          }
        } else if (dbError) {
          console.error("Supabase Database Query Error:", dbError.message);
        }
      }

      // 2. RESPALDO SEMÁNTICO POR PALABRA CLAVE
      if (!contextText) {
        const cleanInput = currentInput.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const keywords = cleanInput.split(" ").filter(w => w.length > 5);
        
        if (keywords.length > 0) {
          const { data: keywordFragments } = await supabase
            .from('documents')
            .select('content, metadata')
            .ilike('content', `%${keywords[0]}%`)
            .limit(10);

          if (keywordFragments && keywordFragments.length > 0) {
            const filteredKeywords = keywordFragments.filter(f => f.metadata?.version === 'RV1865').slice(0, 3);
            contextText = filteredKeywords.map(f => f.content).join("\n\n");
          }
        }
      }

      // 3. ENVÍO SEGURO DEL CONTEXTO REAL A LA API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: updatedMessages, 
          contextText: contextText 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP Error ${res.status}`);
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      fetchHistory(); 
    } catch (error: any) {
      console.error("Patmos Pipeline Error:", error);
      setMessages((prev) => [
        ...prev, 
        { role: "assistant", content: `Aconteció un error en el script: ${error.message || error}` }
      ]);
    } finally { 
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
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

        {/* Lista de Registros del Historial */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px 10px' }}>
          <p style={{ fontSize: '9px', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '1.5px', paddingLeft: '10px', marginBottom: '10px', fontFamily: 'serif' }}>
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
                <span style={{ 
                  fontSize: '12px', 
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
                <span style={{ fontSize: '9px', color: theme.textMuted, fontFamily: theme.fontSans }}>
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
        {/* Header Superior */}
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
              <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '1px', color: theme.textMain }}>
                PATMOS
              </h1>
              {userEmail && (
                <p style={{ fontSize: '9px', color: theme.textMuted, margin: '2px 0 0 0', fontFamily: theme.fontSans, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Station: {userEmail}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '16px' }}
              title="Toggle Theme"
            >
              {isDarkMode ? '☼' : '☾'}
            </button>

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
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
                      <p style={{ 
                        marginBottom: '16px', 
                        marginTop: '0px',
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap'
                      }} className="last:mb-0">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ 
                        fontWeight: '700', 
                        color: 'inherit' 
                      }}>
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

        {/* Caja de Input */}
        <div style={{ width: '100%', maxWidth: '650px', padding: '20px 0 40px 0' }}>
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
          <p style={{ textAlign: 'center', fontSize: '11px', color: theme.textMuted, marginTop: '15px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'serif' }}>
            Based on Rightly Dividing the Word of Truth
          </p>
        </div>
      </main>
    </div>
  );
}