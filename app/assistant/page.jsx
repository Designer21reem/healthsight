"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Archive, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Header from "../../components/Layout/HeaderUser";

export default function AssistantPage() {
  const router = useRouter();

  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [text, setText]             = useState("");
  const [messages, setMessages]     = useState([]);
  const [showChat, setShowChat]     = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSending, setIsSending]   = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  const messagesEndRef = useRef(null);

  const agents = [
    { id:"nutritionist", name:"Nutritionist",     emoji:"🥗" },
    { id:"fitness",      name:"Fitness Trainer",  emoji:"💪" },
    { id:"doctor",       name:"General Doctor",   emoji:"👨‍⚕️" },
    { id:"psychiatrist", name:"Psychiatrist",      emoji:"🧠" },
  ];

  // ── Loading overlay ───────────────────────────────────────────────────────
  const LoadingOverlay = () => (
    <AnimatePresence>
      {(loading || logoutLoading) && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/25" />
          <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }}
            className="relative bg-white rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800">
                {logoutLoading ? "Signing you out" : "Preparing your assistant"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {logoutLoading ? "Please wait a moment…" : "Loading your profile…"}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    initializeAssistant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initializeAssistant() {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) { router.push("/"); return; }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(profileData || null);

      await fetchChatSessions();
      setLoading(false);
    } catch (e) {
      console.error("initializeAssistant error:", e);
      router.push("/");
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── sessions ──────────────────────────────────────────────────────────────
  async function fetchChatSessions() {
    const { data, error } = await supabase
      .from("ai_chat_sessions")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) { console.error("fetchChatSessions error:", error); return; }
    setChatHistory(data || []);
  }

  async function createNewChatSession(firstUserText = "") {
    if (!user?.id) return null;
    const title = firstUserText.trim().length > 0
      ? firstUserText.trim().split(/\s+/).slice(0, 6).join(" ")
      : "New chat";
    const { data, error } = await supabase
      .from("ai_chat_sessions").insert([{ user_id: user.id, title }]).select("id").single();
    if (error) { console.error("createNewChatSession error:", error); return null; }
    await fetchChatSessions();
    return data?.id || null;
  }

  async function touchSession(sessionId) {
    if (!sessionId) return;
    const { error } = await supabase.from("ai_chat_sessions").update({}).eq("id", sessionId);
    if (error) console.error("touchSession error:", error);
  }

  async function saveMessageToDb(sessionId, msg) {
    if (!user?.id || !sessionId) return;
    const { error } = await supabase.from("ai_chat_messages").insert([{
      session_id: sessionId,
      user_id:    user.id,
      sender:     msg.sender,
      text:       msg.text,
      agent_id:   msg.agentId   || null,
      agent_name: msg.agentName || null,
      emoji:      msg.emoji     || null,
      color:      msg.color     || null,
    }]);
    if (error) console.error("saveMessageToDb error:", error);
  }

  // ── logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try { await supabase.auth.signOut(); } catch (e) { console.error("Logout error:", e); }
    finally { router.push("/"); }
  };

  // ── chat actions ──────────────────────────────────────────────────────────
  const deleteChat = async (chatId) => {
    try {
      const { error } = await supabase.from("ai_chat_sessions").delete().eq("id", chatId);
      if (error) throw error;
      if (currentChatId === chatId) { setMessages([]); setShowChat(false); setText(""); setCurrentChatId(null); }
      await fetchChatSessions();
    } catch (e) { console.error("deleteChat error:", e); }
  };

  const loadChatFromHistory = async (chat) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_chat_messages").select("*").eq("session_id", chat.id).order("created_at", { ascending: true });
      if (error) { console.error("loadChatFromHistory error:", error); setLoading(false); return; }

      setMessages((data || []).map((m) => ({
        id:        m.id,
        text:      m.text,
        sender:    m.sender,
        agentName: m.agent_name || undefined,
        agentId:   m.agent_id   || undefined,
        emoji:     m.emoji      || undefined,
        color:     m.color      || undefined,
        time:      new Date(m.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
        date:      m.created_at,
      })));

      setShowChat(true); setShowArchive(false); setCurrentChatId(chat.id);
      setLoading(false);
    } catch (e) { console.error("loadChatFromHistory unexpected:", e); setLoading(false); }
  };

  const startNewChat = () => { setMessages([]); setShowChat(false); setText(""); setCurrentChatId(null); };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });

  const initials =
    profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  // ── send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    const originalText = text;

    const userMessage = {
      id:     `local-${Date.now()}`,
      text:   originalText,
      sender: "user",
      time:   new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      date:   new Date().toISOString(),
    };

    let sessionId = currentChatId;
    if (!sessionId) { sessionId = await createNewChatSession(originalText); setCurrentChatId(sessionId); }

    setMessages((prev) => [...prev, userMessage]);
    setText(""); setShowChat(true);

    if (sessionId) { await saveMessageToDb(sessionId, userMessage); await touchSession(sessionId); await fetchChatSessions(); }

    try {
      const res = await fetch("/api/symptoms", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: originalText }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || "API error"); }

      const data = await res.json();
      const agentMessages = (data.replies || []).map((r, i) => ({
        id:        `agent-local-${Date.now()}-${i}`,
        text:      r.text,
        sender:    "agent",
        agentName: r.name,
        agentId:   r.id || null,
        emoji:     r.emoji,
        color:     r.color,
        time:      new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
        date:      new Date().toISOString(),
      }));

      for (let i = 0; i < agentMessages.length; i++) {
        const msg = agentMessages[i];
        await new Promise((r) => setTimeout(r, (i + 1) * 350));
        setMessages((prev) => [...prev, msg]);
        if (sessionId) { await saveMessageToDb(sessionId, msg); await touchSession(sessionId); }
      }

      if (sessionId) await fetchChatSessions();
      setIsSending(false);
    } catch (e) {
      const errorMsg = {
        id:        `err-${Date.now()}`,
        text:      "Connection error. Check /api/symptoms and try again.",
        sender:    "agent",
        agentName: "System",
        emoji:     "⚠️",
        color:     "text-gray-600",
        time:      new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
        date:      new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      if (sessionId) { await saveMessageToDb(sessionId, errorMsg); await touchSession(sessionId); await fetchChatSessions(); }
      setIsSending(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 antialiased">
      <LoadingOverlay />

      {/* Shared header */}
      <Header
        profile={profile}
        user={user}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        showAssistantBtn={false}   // already on assistant page
        showBackBtn={true}          // show back-to-dashboard link
      />

      <main className="flex flex-col h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.div key="initial" initial={{ opacity:1 }} exit={{ opacity:0 }}
              className="max-w-3xl w-full mx-auto text-center py-16 px-6 overflow-hidden">
              <motion.img
                initial={{ scale:0.8, opacity:0 }}
                animate={{ scale:[0.9,1,0.98,1], y:[0,-10,-6,0], rotate:[0,3,-3,0], opacity:1 }}
                transition={{ duration:3.6, repeat:Infinity, repeatType:"loop", ease:"easeInOut", delay:0.1 }}
                src="/robot.svg" alt="assistant"
                className="mx-auto w-48 h-48 mb-6"
                loading="lazy"
                onError={(e) => { e.currentTarget.src="/robot-large.png"; }}
              />
              <motion.h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                Hi there, <span className="text-purple-600">{profile?.full_name?.split(" ")[0] || "friend"}</span>
              </motion.h1>
              <motion.h2 className="text-2xl md:text-3xl font-semibold mb-3">
                How are <span className="text-purple-600">you feeling</span> today?
              </motion.h2>
              <motion.p className="text-sm text-gray-500 mb-6">
                Tell me about your symptoms, and I'll try to help
              </motion.p>

              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {agents.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-purple-200 bg-purple-50 text-purple-600">
                    <span className="text-lg">{a.emoji}</span>
                    <span className="text-sm font-medium">{a.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  onClick={async () => { setShowArchive(true); await fetchChatSessions(); }}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                  <Archive className="w-5 h-5 text-indigo-500" />
                </motion.button>

                <div className="flex-1">
                  <textarea value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Ask Our AI Health" maxLength={1000}
                    className="w-full rounded-full border-2 border-purple-200 h-12 px-4 py-3 resize-none focus:outline-none focus:border-purple-300 transition-colors"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                </div>

                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  onClick={sendMessage} disabled={isSending}
                  className="ml-1 w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="mt-2 text-right text-xs text-gray-400">{text.length}/1000</div>
            </motion.div>

          ) : (
            <div key="chat" className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-4 min-h-0">
              <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1 hide-scrollbar">
                {messages.map((message) => (
                  <motion.div key={message.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {message.sender === "user" ? (
                      <div className="flex items-end gap-2 max-w-[80%]">
                        <div className="flex flex-col items-end">
                          <div className="bg-purple-100 border border-purple-200 rounded-2xl rounded-br-none px-4 py-3">
                            <p className="text-gray-800">{message.text}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{message.time}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          {initials}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 max-w-[80%]">
                        <span className="text-2xl">{message.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${message.color}`}>{message.agentName}</h3>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                            <p className="text-gray-700 whitespace-pre-wrap">{message.text}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-right">{message.time}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 text-gray-600 text-sm">
                      Agents are thinking…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <motion.div className="shrink-0 bg-white border-t border-gray-200 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={async () => { setShowArchive(true); await fetchChatSessions(); }}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                    <Archive className="w-5 h-5 text-indigo-500" />
                  </motion.button>

                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={startNewChat}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
                    <Plus className="w-5 h-5 text-purple-600" />
                  </motion.button>

                  <div className="flex-1">
                    <textarea value={text} onChange={(e) => setText(e.target.value)}
                      placeholder="Ask Our AI Health" maxLength={1000}
                      className="w-full rounded-full border-2 border-purple-200 h-12 px-4 py-3 resize-none focus:outline-none focus:border-purple-300 transition-colors"
                      rows={1}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                  </div>

                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={sendMessage} disabled={isSending}
                    className="ml-1 w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="mt-2 text-right text-xs text-gray-400">{text.length}/1000</div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Archive modal */}
        <AnimatePresence>
          {showArchive && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-md" onClick={() => setShowArchive(false)} aria-hidden />
              <motion.div initial={{ scale:0.96, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.96, opacity:0 }}
                transition={{ duration:0.18 }}
                className="relative bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto hide-scrollbar shadow-2xl ring-1 ring-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Chat History</h3>
                  <button onClick={() => setShowArchive(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {chatHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Archive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No chat history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatHistory.map((chat) => (
                      <div key={chat.id} className="flex items-start justify-between gap-3">
                        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                          onClick={() => loadChatFromHistory(chat)}
                          className="flex-1 text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex justify-end items-start mb-2">
                            <span className="text-xs text-gray-500">{formatDate(chat.updated_at || chat.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-800 font-semibold truncate">{chat.title || "Chat"}</p>
                        </motion.button>
                        <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                          className="mt-3 px-3 py-2 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}