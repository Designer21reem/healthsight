"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// ── Notification bell icon ────────────────────────────────────────────────────
function BellIcon({ hasUnread }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  const levelText = (level) =>
    level === "red" ? "text-red-700" : level === "yellow" ? "text-yellow-700" : "text-green-700";

  const levelBadge = (level) =>
    level === "red"    ? "bg-red-100 text-red-700"
    : level === "yellow" ? "bg-yellow-100 text-yellow-700"
    : "bg-green-100 text-green-700";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4 sm:pr-6">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
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
              <button
                onClick={onMarkAllRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
        </div>

        {/* List */}
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
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  n.is_read ? "opacity-60" : "hover:bg-gray-50"
                }`}
              >
                <div className={`rounded-xl border p-3 ${levelColor(n.outbreak_level)}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${levelBadge(n.outbreak_level)}`}>
                        {n.outbreak_level?.toUpperCase()}
                      </span>
                      <span className={`text-xs font-medium ${levelText(n.outbreak_level)}`}>
                        {n.disease}
                      </span>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{n.county}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(n.sent_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
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
/**
 * Props:
 *   profile        – { full_name, avatar_url, role }
 *   user           – { id }
 *   onLogout       – async fn
 *   logoutLoading  – bool
 *   showAssistantBtn – bool (show robot icon, default true)
 *   showBackBtn    – bool (show back-to-dashboard arrow, default false)
 */
export default function HeaderUser({
  profile,
  user,
  onLogout,
  logoutLoading = false,
  showAssistantBtn = true,
  showBackBtn = false,
}) {
  const router = useRouter();

  const [notifications, setNotifications]     = useState([]);
  const [showNotifModal, setShowNotifModal]   = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── fetch notifications ──────────────────────────────────────────────────
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
    // Poll every 30s for new notifications
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("user_notifications_" + user.id)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── mark one as read ─────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  // ── mark all as read ─────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user?.id]);

  // initials
  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 sm:h-20 sm:py-0">

            {/* Brand / back */}
            {showBackBtn ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => router.push("/user")}
                className="flex items-center gap-1 cursor-pointer min-w-[140px]"
                aria-label="Back to dashboard"
              >
                <span className="text-xl sm:text-2xl font-extrabold leading-none">
                  <span className="text-blue-600">Health</span>
                  <span className="text-slate-800 ml-1">Sight</span>
                </span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 min-w-[140px]"
              >
                <span className="text-xl sm:text-2xl font-extrabold leading-none">
                  <span className="text-blue-600">Health</span>
                  <span className="text-slate-800 ml-1">Sight</span>
                </span>
              </motion.div>
            )}

            {/* Right side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              {/* Avatar + name */}
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
                  <span className="text-sm font-semibold">{profile?.full_name || "User"}</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                    {profile?.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>
              </div>

              {/* Notification bell */}
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowNotifModal((v) => !v)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
                title="Notifications"
              >
                <BellIcon hasUnread={unreadCount > 0} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Assistant button */}
              {showAssistantBtn && (
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  }}
                  onClick={() => router.push("/assistant")}
                  className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 hover:shadow-md border border-indigo-100"
                  aria-label="Open AI Assistant"
                  title="AI Assistant"
                >
                  <motion.span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.9, 0.35, 0.9] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="7" width="16" height="10" rx="2" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.2" />
                    <circle cx="9" cy="11" r="1" fill="#4F46E5" />
                    <circle cx="15" cy="11" r="1" fill="#4F46E5" />
                    <path d="M8 17H16" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x="10" y="4" width="4" height="3" rx="1" fill="#C7D2FE" stroke="#6366F1" strokeWidth="0.8" />
                  </svg>
                </motion.button>
              )}

              {/* Logout */}
              <motion.button
                whileHover={{ scale: logoutLoading ? 1 : 1.03 }}
                whileTap={{ scale: logoutLoading ? 1 : 0.97 }}
                onClick={onLogout}
                disabled={logoutLoading}
                className={`rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 ${
                  logoutLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
                aria-label="Logout"
                title="Logout"
              >
                <span className="hidden sm:inline text-sm text-gray-600 hover:text-red-600">Logout</span>
                <LogOut className="sm:hidden w-5 h-5 text-gray-600" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

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