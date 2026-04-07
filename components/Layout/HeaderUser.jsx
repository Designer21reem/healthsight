"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// ── Notification bell icon ────────────────────────────────────────────────────
function BellIcon({ hasUnread }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={hasUnread ? "#EF4444" : "#6B7280"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={hasUnread ? "#EF4444" : "#6B7280"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Notification modal ────────────────────────────────────────────────────────
function NotificationModal({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  const levelColor = (level) =>
    level === "red"    ? "bg-red-50 border-red-200"
    : level === "yellow" ? "bg-yellow-50 border-yellow-200"
    : "bg-green-50 border-green-200";

  const levelBadge = (level) =>
    level === "red"    ? "bg-red-100 text-red-700"
    : level === "yellow" ? "bg-yellow-100 text-yellow-700"
    : "bg-green-100 text-green-700";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-3 sm:pr-6">
      <div className="fixed inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative w-[calc(100%-24px)] sm:w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {notifications.filter((n) => !n.is_read).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <button onClick={onMarkAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">🔔</div>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && onMarkRead(n.id)}
                className={`px-4 py-3 cursor-pointer transition-colors ${n.is_read ? "opacity-60" : "hover:bg-gray-50"}`}
              >
                <div className={`rounded-xl border p-3 ${levelColor(n.outbreak_level)}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${levelBadge(n.outbreak_level)}`}>
                        {n.outbreak_level?.toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-gray-700">{n.disease}</span>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{n.county}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(n.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Shared Header ─────────────────────────────────────────────────────────────
export default function HeaderUser({
  profile,
  user,
  onLogout,
  logoutLoading = false,
  showAssistantBtn = true,
  showBackBtn = false,
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false })
        .limit(30);
      if (!error && data) setNotifications(data);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("user_notifications_" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "user_notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => setNotifications((prev) => [payload.new, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markRead = useCallback(async (id) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await supabase.from("user_notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user?.id]);

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-20">
            
            {/* Brand */}
            {showBackBtn ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => router.push("/user")}
                className="flex items-center cursor-pointer"
                aria-label="Back to dashboard"
              >
                <span className="text-lg sm:text-2xl font-extrabold leading-none">
                  <span className="text-blue-600">Health</span>
                  <span className="text-slate-800 ml-0.5 sm:ml-1">Sight</span>
                </span>
              </motion.button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center">
                <span className="text-lg sm:text-2xl font-extrabold leading-none">
                  <span className="text-blue-600">Health</span>
                  <span className="text-slate-800 ml-0.5 sm:ml-1">Sight</span>
                </span>
              </motion.div>
            )}

            {/* Desktop Right Side */}
            <div className="hidden sm:flex items-center gap-2 lg:gap-3">
              {/* Avatar + name */}
              <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || "User"} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs lg:text-sm">
                    {initials}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{profile?.full_name?.split(" ")[0] || "User"}</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                    {profile?.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>
              </div>

              {/* Notification bell */}
              <button
                onClick={() => setShowNotifModal((v) => !v)}
                className="relative flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <BellIcon hasUnread={unreadCount > 0} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={onLogout}
                disabled={logoutLoading}
                className={`rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 transition-colors flex items-center gap-2 px-3 py-2 ${logoutLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className="text-sm text-gray-600 hover:text-red-600">Logout</span>
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Mobile: Brand + Icons row (single line) */}
            <div className="flex sm:hidden items-center gap-2">
              {/* Notification bell */}
              <button
                onClick={() => setShowNotifModal((v) => !v)}
                className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BellIcon hasUnread={unreadCount > 0} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Avatar (click to open mobile menu) */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center gap-1"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || "User"} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                    {initials}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Drawer - بدون استخدام Menu و X */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowMobileMenu(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-64 bg-white shadow-xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-900">Account</span>
                  <button onClick={() => setShowMobileMenu(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 text-xl">
                    ✕
                  </button>
                </div>
                
                <div className="flex flex-col items-center p-4 border-b border-gray-100">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-16 h-16 rounded-full object-cover mb-2" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-2">
                      {initials}
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">{profile?.full_name || "User"}</span>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                    {profile?.role === "admin" ? "Admin" : "User"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">{user?.email}</span>
                  {profile?.governorate && (
                    <span className="text-xs text-gray-500 mt-0.5">📍 {profile.governorate}</span>
                  )}
                </div>

                <div className="flex-1 p-3">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      router.push("/assistant");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors mb-1"
                  >
                    <span className="text-xl">🤖</span>
                    <span className="text-sm text-gray-700">AI Assistant</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      router.push("/user");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors mb-1"
                  >
                    <span className="text-xl">📊</span>
                    <span className="text-sm text-gray-700">Dashboard</span>
                  </button>
                </div>

                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onLogout();
                    }}
                    disabled={logoutLoading}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification modal */}
      <AnimatePresence>
        {showNotifModal && (
          <NotificationModal
            notifications={notifications}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onClose={() => setShowNotifModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}