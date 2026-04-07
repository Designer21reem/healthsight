"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginForm({ open, onClose, onShowRegister }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSwitchToRegister = () => {
    onShowRegister?.();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      // Clean any stale locks before login attempt
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          const lockKey = `sb-${supabaseUrl.replace(/https?:\/\//, '').replace(/\./g, '-')}-auth-token`;
          localStorage.removeItem(lockKey);
        }
      } catch(e) {}

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        if (authError.message?.includes("Invalid login credentials")) {
          setError("Invalid email or password.");
        } else if (authError.message?.includes("Email not confirmed")) {
          setError("Please confirm your email address first.");
        } else if (authError.message?.toLowerCase()?.includes("rate limit")) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError(authError.message || "Login failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (authData?.user) {
        let userRole = "user";
        
        try {
          // Try to get profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Profile fetch error:", profileError);
          }
          
          if (profileData?.role) {
            userRole = profileData.role;
          } else {
            // Create profile if doesn't exist
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || "User",
                role: "user",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            
            if (insertError) {
              console.error("Profile creation error:", insertError);
            }
          }
        } catch (err) {
          console.error("Profile handling error:", err);
        }

        setEmail("");
        setPassword("");
        onClose?.();

        const redirectPath = userRole === "admin" ? "/admin" : "/user";
        
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 100);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
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

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-2 text-gray-500 hover:bg-gray-100"
          disabled={loading}
        >
          ✕
        </button>

        <header className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold">
            Sign in to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">
              Health Companion
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-500">Welcome back! Please enter your details.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-gray-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                Signing in...
              </div>
            ) : (
              "Log in"
            )}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className="text-indigo-600 hover:underline font-medium"
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}