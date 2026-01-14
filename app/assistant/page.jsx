"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Archive, Plus, X, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function AssistantPage() {
  const router = useRouter();

  // ✅ Auth/Profile
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // ✅ UI
  const [loading, setLoading] = useState(true);
  // ✅ لودر خاص للوك اوت
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Chat state
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const agents = [
    { id: "nutritionist", name: "Nutritionist", emoji: "🥗" },
    { id: "fitness", name: "Fitness Trainer", emoji: "💪" },
    { id: "doctor", name: "General Doctor", emoji: "👨‍⚕️" },
    { id: "psychiatrist", name: "Psychiatrist", emoji: "🧠" },
  ];

  // ✅ Loading Overlay (نفس ستايل اليوزر) + يدعم لوك اوت
  const LoadingOverlay = () => (
    <AnimatePresence>
      {(loading || logoutLoading) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/25" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800">
                {logoutLoading ? "Signing you out" : "Preparing your assistant"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {logoutLoading ? "Please wait a moment..." : "Loading your profile..."}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ✅ Init (جلسة + بروفايل)
  useEffect(() => {
    initializeAssistant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initializeAssistant() {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData || null);

      // Load history
      const saved = localStorage.getItem("chatHistory");
      if (saved) {
        try {
          setChatHistory(JSON.parse(saved));
        } catch {}
      }

      setLoading(false);
    } catch (e) {
      console.error("initializeAssistant error:", e);
      router.push("/");
    }
  }

  // Save history
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ Logout + لودر
  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      router.push("/");
      // ما نطفي اللودر لأن الصفحة راح تتغير
    }
  };

  const deleteChat = (chatId) => {
    setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setMessages([]);
      setShowChat(false);
      setText("");
      setCurrentChatId(null);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    const originalText = text;

    const userMessage = {
      id: Date.now(),
      text: originalText,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString(),
    };

    let chatId = currentChatId;
    if (!chatId) {
      chatId = Date.now();
      setCurrentChatId(chatId);

      const title = originalText.trim().split(/\s+/).slice(0, 6).join(" ");
      const newSession = {
        id: chatId,
        date: new Date().toISOString(),
        userMessage: title,
        messages: [],
      };

      setChatHistory((prev) => [newSession, ...prev]);
    }

    setMessages((prev) => [...prev, userMessage]);
    setText("");
    setShowChat(true);

    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
      )
    );

    try {
      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: originalText }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "API error");
      }

      const data = await res.json();
      const agentMessages = (data.replies || []).map((r, i) => ({
        id: Date.now() + i + 1,
        text: r.text,
        sender: "agent",
        agentName: r.name,
        emoji: r.emoji,
        color: r.color,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toISOString(),
      }));

      agentMessages.forEach((msg, idx) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, msg]);

          setChatHistory((prev) =>
            prev.map((chat) =>
              chat.id === chatId ? { ...chat, messages: [...chat.messages, msg] } : chat
            )
          );

          if (idx === agentMessages.length - 1) setIsSending(false);
        }, (idx + 1) * 1200);
      });
    } catch (e) {
      const errorMsg = {
        id: Date.now() + 999,
        text: "صار خطأ بالاتصال بالباك اند. تأكد من /api/symptoms وجرّب مرة ثانية.",
        sender: "agent",
        agentName: "System",
        emoji: "⚠️",
        color: "text-gray-600",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMsg]);
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, errorMsg] } : chat
        )
      );
      setIsSending(false);
    }
  };

  const loadChatFromHistory = (chat) => {
    setMessages(chat.messages);
    setShowChat(true);
    setShowArchive(false);
    setCurrentChatId(chat.id);
  };

  const startNewChat = () => {
    setMessages([]);
    setShowChat(false);
    setText("");
    setCurrentChatId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ initials for avatar fallback
  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <LoadingOverlay />

      {/* ✅ Header (نفس مال UserPage: responsive mobile) */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 sm:h-20 sm:py-0">
            {/* Brand -> يرجع لليوزر بيج */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => router.push("/user")}
              className="flex items-center gap-1 cursor-pointer min-w-[140px]"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <div className="text-xl sm:text-2xl font-extrabold leading-none">
                <span className="text-blue-600">Health</span>
                <span className="text-slate-800 ml-1">Sight</span>
              </div>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 sm:gap-4"
            >
              {/* Profile (✅ مربوط بجدول profiles) */}
              <div className="flex items-center gap-2 pr-2 sm:pr-4 sm:border-r sm:border-gray-100">
                {profile?.avatar_url ? (
                  <motion.img
                    whileHover={{ scale: 1.06 }}
                    src={profile.avatar_url}
                    alt={profile.full_name || "User"}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                  />
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm"
                  >
                    {initials}
                  </motion.div>
                )}

                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-semibold">
                    {profile?.full_name || user?.email || "User"}
                  </span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                    {profile?.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>
              </div>

              {/* زر رجوع للداشبورد (اختياري) */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/user")}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-colors px-3 py-2 text-sm font-medium text-indigo-700"
                title="Back"
              >
                Back
              </motion.button>

              {/* Logout + Disable اثناء اللودر */}
              <motion.button
                whileHover={{ scale: logoutLoading ? 1 : 1.03 }}
                whileTap={{ scale: logoutLoading ? 1 : 0.97 }}
                onClick={handleLogout}
                disabled={logoutLoading}
                className={`rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 ${
                  logoutLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
                aria-label="Logout"
                title="Logout"
              >
                <span className="hidden sm:inline text-sm text-gray-600 hover:text-red-600">
                  Logout
                </span>
                <LogOut className="sm:hidden w-5 h-5 text-gray-600" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {!showChat ? (
            // Initial screen
            <motion.div
              key="initial"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl w-full mx-auto text-center py-16 px-6"
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.9, 1, 0.98, 1],
                  y: [0, -10, -6, 0],
                  rotate: [0, 3, -3, 0],
                  opacity: 1,
                }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                  delay: 0.1,
                }}
                src="/robot.svg"
                alt="assistant"
                className="mx-auto w-48 h-48 mb-6"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/robot-large.png";
                }}
              />

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-extrabold mb-2"
              >
                Hi there,
                <span className="text-purple-600">
                  {" "}
                  {profile?.full_name?.split(" ")[0] || "friend"}
                </span>
              </motion.h1>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-semibold mb-3"
              >
                How are <span className="text-purple-600">you feeling</span> today ?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-500 mb-6"
              >
                Tell me about your symptoms, and I&apos;ll try to help
              </motion.p>

              {/* badges */}
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {agents.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-purple-200 bg-purple-50 text-purple-600"
                  >
                    <span className="text-lg">{a.emoji}</span>
                    <span className="text-sm font-medium">{a.name}</span>
                  </div>
                ))}
              </div>

              {/* input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowArchive(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    aria-label="Chat history"
                    title="Chat History"
                  >
                    <Archive className="w-5 h-5 text-indigo-500" />
                  </motion.button>

                  <div className="flex-1">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Ask Our AI Health"
                      maxLength={1000}
                      className="w-full rounded-full border-2 border-purple-200 h-12 px-4 py-3 resize-none focus:outline-none focus:border-purple-300 transition-colors"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={isSending}
                    className="ml-1 w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="mt-2 text-right text-xs text-gray-400">{text.length}/1000</div>
              </motion.div>
            </motion.div>
          ) : (
            // Chat screen
            <div
              key="chat"
              className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-4 h-[calc(100vh-80px)]"
            >
              {/* messages */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
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
                      Agents are thinking...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* bottom bar */}
              <motion.div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowArchive(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    aria-label="Chat history"
                    title="Chat History"
                  >
                    <Archive className="w-5 h-5 text-indigo-500" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startNewChat}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
                    aria-label="New chat"
                    title="New Chat"
                  >
                    <Plus className="w-5 h-5 text-purple-600" />
                  </motion.button>

                  <div className="flex-1">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Ask Our AI Health"
                      maxLength={1000}
                      className="w-full rounded-full border-2 border-purple-200 h-12 px-4 py-3 resize-none focus:outline-none focus:border-purple-300 transition-colors"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={isSending}
                    className="ml-1 w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                    title="Send"
                  >
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-white/20 backdrop-blur-md transition-opacity"
                onClick={() => setShowArchive(false)}
                aria-hidden
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl ring-1 ring-white/20"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Chat History</h3>
                  <button
                    onClick={() => setShowArchive(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
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
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => loadChatFromHistory(chat)}
                          className="flex-1 text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-end items-start mb-2">
                            <span className="text-xs text-gray-500">{formatDate(chat.date)}</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{chat.userMessage}</p>

                          <div className="flex gap-2 mt-2">
                            {Array.from(
                              new Set(
                                (chat.messages || [])
                                  .filter((m) => m.sender === "agent" && m.emoji)
                                  .map((m) => m.emoji)
                              )
                            ).map((emoji, i) => (
                              <span key={i} className="text-lg">
                                {emoji}
                              </span>
                            ))}
                          </div>
                        </motion.button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="mt-3 px-3 py-2 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
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
