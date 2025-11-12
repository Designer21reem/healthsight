"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Archive, X } from "lucide-react";

export default function AssistantPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("nutritionist");
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const agents = [
    {
      id: "nutritionist",
      name: "Nutritionist",
      emoji: "🥗",
      color: "text-green-600",
      response: "Figma Ipsum component variant main layer. Draft pen strikerhrough undo select italic auto opacity."
    },
    {
      id: "fitness",
      name: "Fitness Trainer", 
      emoji: "💪",
      color: "text-orange-600",
      response: "Figma Ipsum component variant main layer. Draft pen strikerhrough undo select italic auto opacity."
    },
    {
      id: "doctor",
      name: "General Doctor",
      emoji: "👨‍⚕️",
      color: "text-purple-600",
      response: "Figma Ipsum component variant main layer. Draft pen strikerhrough undo select italic auto opacity."
    },
    {
      id: "psychiatrist",
      name: "Psychiatrist",
      emoji: "🧠", 
      color: "text-pink-600",
      response: "Please know a successful variant with less. Puffs are administered under strict faith care needs."
    }
  ];

  const sendMessage = () => {
    if (!text.trim() || isSending) return;
    
    setIsSending(true);
    
    // إضافة رسالة المستخدم
    const userMessage = {
      id: Date.now(),
      text: text,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agent: selectedAgent,
      date: new Date().toISOString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setText("");
    setShowChat(true);

    // إرسال ردود الـ agents تباعاً
    agents.forEach((agent, index) => {
      setTimeout(() => {
        const agentMessage = {
          id: Date.now() + index + 1,
          text: agent.response,
          sender: "agent",
          agentName: agent.name,
          emoji: agent.emoji,
          color: agent.color,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, agentMessage]);
        
        // حفظ المحادثة في الأرشيف عند اكتمال جميع الردود
        if (index === agents.length - 1) {
          const chatToSave = {
            id: Date.now(),
            date: new Date().toISOString(),
            userMessage: text,
            agent: selectedAgent,
            messages: [...newMessages, ...agents.map((a, i) => ({
              id: Date.now() + i + 1,
              text: a.response,
              sender: "agent",
              agentName: a.name,
              emoji: a.emoji,
              color: a.color,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date().toISOString()
            }))]
          };
          setChatHistory(prev => [chatToSave, ...prev]);
          setIsSending(false);
        }
      }, (index + 1) * 2000); // كل 2 ثانية بدل 3
    });
  };

  const loadChatFromHistory = (chat) => {
    setMessages(chat.messages);
    setShowChat(true);
    setShowArchive(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setShowChat(false);
    setText("");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => router.push("/user")}
                className="text-2xl font-extrabold flex items-center gap-1 cursor-pointer"
                aria-label="Back to dashboard"
                title="Back to dashboard"
              >
                <span className="text-blue-600">Health</span>
                <span className="text-slate-800">Sight</span>
              </button>
            </motion.div>

            <div className="flex-1 hidden md:block" />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  NA
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-semibold">Noor Ahmed</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">User</span>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                animate={{ y: [0, -6, 0], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 hover:shadow-md border border-indigo-100"
                title="AI Assistant"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="7" width="16" height="10" rx="2" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.2"/>
                  <circle cx="9" cy="11" r="1" fill="#4F46E5"/>
                  <circle cx="15" cy="11" r="1" fill="#4F46E5"/>
                  <path d="M8 17H16" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round"/>
                  <rect x="10" y="4" width="4" height="3" rx="1" fill="#C7D2FE" stroke="#6366F1" strokeWidth="0.8"/>
                </svg>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="notifications"
                title="Notifications"
                className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-white border border-gray-100 hover:bg-gray-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
                        stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
                        stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="6" r="3" fill="#EF4444" stroke="white" strokeWidth="1"/>
                </svg>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {!showChat ? (
            // الواجهة الأولية
            <motion.div
              key="initial"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl w-full mx-auto text-center py-16 px-6"
            >
              {/* robot image */}
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.9, 1, 0.98, 1], y: [0, -10, -6, 0], rotate: [0, 3, -3, 0], opacity: 1 }}
                transition={{ duration: 3.6, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0.1 }}
                src="/robot.svg"
                alt="assistant"
                className="mx-auto w-48 h-48 mb-6"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = "/robot-large.png"; }}
              />

              {/* greeting */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-extrabold mb-2"
              >
                Hi there,<span className="text-purple-600"> John</span>
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
                Tell me about your symptoms, and I'll try to help
              </motion.p>
              {/* agent selection pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3 justify-center mb-8"
              >
                {agents.map((agent) => (
                  <motion.button
                    key={agent.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 ${
                      selectedAgent === agent.id
                        ? "border-purple-300 bg-purple-100 text-purple-700"
                        : "border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100"
                    }`}
                  >
                    <span className="text-lg">{agent.emoji}</span>
                    <span className="text-sm font-medium">{agent.name}</span>
                  </motion.button>
                ))}
              </motion.div>

              {/* input bar */}
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
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
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
                    className="ml-3 w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="mt-2 text-right text-xs text-gray-400">
                  {text.length}/1000
                </div>
              </motion.div>
            </motion.div>
          ) : (
            // واجهة المحادثة بعد الإرسال
            <div key="chat" className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-4">
              {/* زر الأرشيف في الشريط العلوي */}
              <div className="flex justify-between items-center mb-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startNewChat}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  New Chat
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowArchive(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  aria-label="Chat history"
                  title="Chat History"
                >
                  <Archive className="w-4 h-4" />
                  History
                </motion.button>
              </div>

              {/* عرض المحادثة */}
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "user" ? (
                      // رسالة المستخدم - من اليمين
                      <div className="flex items-end gap-2 max-w-[80%]">
                        <div className="flex flex-col items-end">
                          <div className="bg-purple-100 border border-purple-200 rounded-2xl rounded-br-none px-4 py-3">
                            <p className="text-gray-800">{message.text}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{message.time}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          NA
                        </div>
                      </div>
                    ) : (
                      // رسالة الـ Agent - من اليسار
                      <div className="flex items-start gap-3 max-w-[80%]">
                        <span className="text-2xl">{message.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${message.color}`}>{message.agentName}</h3>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                            <p className="text-gray-700">{message.text}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-right">{message.time}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* حقل الإرسال يبقى في الأسفل */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-gray-200 pt-4"
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
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
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
                    className="ml-3 w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="mt-2 text-right text-xs text-gray-400">
                  {text.length}/1000
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* نافذة الأرشيف */}
        <AnimatePresence>
          {showArchive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              {/* backdrop: stronger, frosted blur (light, not black) to make archive pop */}
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
                    <X className="w-5 h-5" />
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
                      <motion.button
                        key={chat.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadChatFromHistory(chat)}
                        className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {/* عرض التاريخ فقط في الأعلى - أحذف اسم الـ agent */}
                        <div className="flex justify-end items-start mb-2">
                          <span className="text-xs text-gray-500">{formatDate(chat.date)}</span>
                        </div>
                        
                        {/* عنوان الرسالة (نص المستخدم) */}
                        <p className="text-sm text-gray-600 truncate">{chat.userMessage}</p>
                        
                        {/* رموز الـ agents المشاركين فقط (مأخوذة من رسائل الـ chat المحفوظ) */}
                        <div className="flex gap-2 mt-2">
                          {Array.from(
                            new Set(
                              (chat.messages || [])
                                .filter((m) => m.sender === "agent" && m.emoji)
                                .map((m) => m.emoji)
                            )
                          ).map((emoji, i) => (
                            <span key={i} className="text-lg">{emoji}</span>
                          ))}
                        </div>
                      </motion.button>
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