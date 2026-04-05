"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function UserProfile() {
  const { user, profile, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  if (!user || !profile) return null;

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    router.push("/");
  };

  const handleProfileClick = () => {
    if (profile?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/user");
    }
    setShowDropdown(false);
  };

  // Default avatar - initials with gradient background
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const avatarUrl = profile?.avatar_url;
  const roleLabel = profile?.role === "admin" ? "Admin" : "User";
  const roleBgColor = profile?.role === "admin" ? "bg-purple-100" : "bg-blue-100";
  const roleTextColor = profile?.role === "admin" ? "text-purple-700" : "text-blue-700";

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile?.full_name}
            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">{profile?.full_name}</div>
          <div className={`text-xs px-2 py-0.5 rounded-full ${roleBgColor} ${roleTextColor} font-semibold`}>
            {roleLabel}
          </div>
        </div>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-16 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-semibold text-gray-900">{profile?.full_name}</div>
            <div className="text-xs text-gray-600">{user?.email}</div>
            {profile?.governorate && (
              <div className="text-xs text-gray-600 mt-1">📍 {profile.governorate}</div>
            )}
          </div>

          <button
            onClick={handleProfileClick}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">👤</span>
            {profile?.role === "admin" ? "Go to Admin Panel" : "Go to Dashboard"}
          </button>

          <a
            href="#"
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              Settings
            </span>
          </a>

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <span className="text-lg">🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
