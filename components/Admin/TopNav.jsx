"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function TopNav({ active, onChange }) {
  const router = useRouter();
  const { profile, loading } = useAuth();

  // ✅ Logout loading
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const tabs = [
    { id: "map", label: "Outbreaks Map" },
    { id: "analysis", label: "Analysis" },
    { id: "users", label: "Users" },
    { id: "articles", label: "Articles" },
  ];

  const fullName = profile?.full_name || "Guest";
  const initials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const avatarUrl = profile?.avatar_url || "";
  const role = (profile?.role || "user").toLowerCase();
  const roleLabel = role === "admin" ? "Admin" : "User";

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      router.push("/");
      // ما نحتاج setIsLoggingOut(false) لأن راح ننتقل من الصفحة
    }
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* ✅ Logout Loading Overlay */}
      <AnimatePresence>
        {isLoggingOut && (
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
                  Signing you out
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Please wait a moment...
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Header (نفس ترتيب UserPage) */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 sm:h-20 sm:py-0">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 min-w-[140px]"
            >
              <div className="text-xl sm:text-2xl font-extrabold leading-none">
                <span className="text-blue-600">Health</span>
                <span className="text-slate-800 ml-1">Sight</span>
              </div>
            </motion.div>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 sm:gap-4"
            >
              {/* Profile (compact on mobile) */}
              <div className="flex items-center gap-2 pr-2 sm:pr-4 sm:border-r sm:border-gray-100">
                {loading ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse" />
                ) : (
                  <>
                    {avatarUrl ? (
                      <motion.img
                        whileHover={{ scale: 1.06 }}
                        src={avatarUrl}
                        alt={fullName}
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

                    {/* hide text on mobile */}
                    <div className="hidden sm:flex flex-col">
                      <span className="text-sm font-semibold">{fullName}</span>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                        {roleLabel}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Notifications */}
              <button
                aria-label="notifications"
                title="Notifications"
                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center w-10 h-10"
              >
                🔔
              </button>

              {/* Logout (icon on mobile) */}
              <motion.button
                whileHover={{ scale: isLoggingOut ? 1 : 1.03 }}
                whileTap={{ scale: isLoggingOut ? 1 : 0.97 }}
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 ${
                  isLoggingOut ? "opacity-60 cursor-not-allowed" : ""
                }`}
                aria-label="Logout"
                title="Logout"
              >
                <span className="hidden sm:inline text-sm text-gray-600 hover:text-red-600">
                  Logout
                </span>

                <svg
                  className="sm:hidden"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1"
                    stroke="#6B7280"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 12H3m0 0l3-3M3 12l3 3"
                    stroke="#6B7280"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* ✅ Tabs نفس ستايل اليوزر (بدون chat icon) */}
      <nav className="mt-4 md:mt-6">
        <div className="rounded-2xl bg-indigo-50 p-2">
          <div className="mx-auto max-w-7xl px-2 sm:px-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {tabs.map((t) => (
                <div
                  key={t.id}
                  className="relative w-[calc(50%-0.25rem)] sm:w-auto"
                >
                  {active === t.id && (
                    <motion.div
                      layoutId="admin-nav-pill"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      className="absolute inset-0 rounded-full bg-indigo-600"
                      style={{ zIndex: 0 }}
                    />
                  )}

                  <button
                    onClick={() => onChange(t.id)}
                    className={`
                      relative z-10
                      w-full sm:w-auto
                      py-2 px-3 sm:px-6
                      rounded-full text-sm font-medium
                      transition-colors duration-200
                      ${
                        active === t.id
                          ? "text-white"
                          : "text-gray-700 hover:text-gray-900"
                      }
                    `}
                  >
                    {t.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
