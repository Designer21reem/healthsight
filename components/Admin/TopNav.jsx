"use client";
import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function TopNav({ active, onChange }) {
  const router = useRouter();

  const tabs = [
    { id: "map", label: "Outbreaks Map" },
    { id: "analysis", label: "Analysis" },
    { id: "users", label: "Users" },
    { id: "articles", label: "Articles" },
  ];

  const { profile, loading } = useAuth();

  const fullName = profile?.full_name || "Guest";
  const initials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const avatarUrl = profile?.avatar_url || "";
  const role = (profile?.role || "user").toLowerCase();
  const roleLabel = role === "admin" ? "Admin" : "User";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      router.push("/");
    }
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* Top Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-extrabold text-blue-600 leading-none">
            Health<span className="text-gray-900">Sight</span>
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop profile */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            ) : (
              <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                {avatarUrl ? (
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    src={avatarUrl}
                    alt={fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm"
                  >
                    {initials}
                  </motion.div>
                )}

                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-semibold">{fullName}</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {roleLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile compact profile */}
          <div className="md:hidden flex items-center gap-2">
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                {initials}
              </div>
            )}
          </div>

          <button
            aria-label="notifications"
            className="h-9 w-9 md:h-10 md:w-10 rounded-full border border-gray-200 flex items-center justify-center"
          >
            🔔
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="text-xs md:text-sm text-gray-600 hover:text-red-600 px-2.5 md:px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            Logout
          </motion.button>
        </div>
      </div>

      {/* Tabs - ✅ Wrap (no scroll) */}
      <nav className="mt-4 md:mt-6">
        <div className="rounded-2xl bg-indigo-50 p-2">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {tabs.map((t) => (
                <div
                  key={t.id}
                  className="
                    relative
                    w-[calc(50%-0.25rem)]
                    sm:w-auto
                  "
                >
                  {active === t.id && (
                    <motion.div
                      layoutId="nav-pill"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
                      ${active === t.id ? "text-white" : "text-gray-700 hover:text-gray-900"}
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
