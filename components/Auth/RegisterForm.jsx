"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";

const IRAQI_GOVERNORATES = [
  "Baghdad",
  "Al-Anbar",
  "Al-Basra",
  "Al-Muthanna",
  "Al-Qadisiyyah",
  "An-Najaf",
  "Arbil",
  "As-Sulaymaniyah",
  "Dhi-Qar",
  "Diyala",
  "Halabjah",
  "Karbala",
  "Kirkuk",
  "Maysan",
  "Nineveh",
  "Salah ad-Din",
  "Wasit",
  "Babil",
];

export default function RegisterForm({ open, onClose, onShowLogin }) {
  const [mounted, setMounted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ✅ مهم: لا تسوي onClose هنا حتى ما يصير تعارض
  const handleSwitchToLogin = () => {
    onShowLogin?.();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword || !confirm || !governorate) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (cleanPassword !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 1) create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: cleanName,
            governorate,
          },
        },
      });

      if (authError) {
        if (authError.message?.includes("already registered") || authError.code === "user_already_exists") {
          setError("This email is already registered. Try logging in.");
        } else if (authError.message?.toLowerCase()?.includes("email")) {
          setError("Email confirmation required. Check your email.");
        } else {
          setError(authError.message || "Registration failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // 2) save profile
      const profileData = {
        id: authData.user.id,
        email: cleanEmail,
        full_name: cleanName,
        governorate,
        role: "user",
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert([profileData], { onConflict: "id" });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }

      // 3) success message
      if (!authData.user.email_confirmed && authData.session === null) {
        setSuccess("Registration successful! Please check your email to confirm your account.");
      } else {
        setSuccess("Registration successful! You can now login.");
      }

      // reset
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setGovernorate("");

      // ✅ رجّع للّوك ان بدون ما تسوي closeAll
      setTimeout(() => {
        onShowLogin?.();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* ✅ ضبط الحجم والشكل */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-auto">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-2 text-gray-500 hover:bg-gray-100"
          disabled={loading}
        >
          ✕
        </button>

        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            <span className="text-gray-900">Sign up to </span>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-violet-500">
              Health Companion
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-500">Create your account in a few steps.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* ✅ ترتيب حقول الاسم والمحافظة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-5 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
                placeholder="Zaynab Luay"
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Governorate <span className="text-red-500">*</span>
              </label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
                required
                disabled={loading}
              >
                <option value="">Select your governorate...</option>
                {IRAQI_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-600">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-5 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
              placeholder="you@example.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* ✅ ترتيب كلمات المرور */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-5 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
                placeholder="••••••••"
                minLength={6}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <div className="mt-1 text-xs text-gray-500">Must be at least 6 characters</div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-5 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
                placeholder="••••••••"
                minLength={6}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-linear-to-r from-pink-500 to-fuchsia-500 px-6 py-3 text-lg font-medium text-white shadow hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </div>
            ) : (
              "Sign up"
            )}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="text-pink-500 hover:underline font-medium"
                disabled={loading}
              >
                Login
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
