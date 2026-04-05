"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LoginForm from "./Auth/LoginForm";
import RegisterForm from "./Auth/RegisterForm";
import UserProfile from "./UserProfile";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ مودلات auth
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // ✅ فتح/غلق + سويتش مضمون
  const closeAll = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };

  const openLoginModal = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegisterModal = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const switchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const [activeSection, setActiveSection] = useState("hero");
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const roleLabel = profile?.role === 'admin' ? 'Admin' : 'User';
  const dashboardHref = profile?.role === 'admin' ? '/admin' : '/user';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Scroll helper with sticky header offset
  const smoothScrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const headerOffset = 90; // قريب من h-20 (80px) + شوي safety
    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  // ✅ Track active section (شيلنا collab)
  useEffect(() => {
    const handleScroll = () => {
      // collab انشال
      const sections = ["hero", "mission", "features", "how", "testimonials", "cta"];
      const current = sections.find((section) => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 120 && rect.bottom >= 120;
        }
        return false;
      });

      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ navItems بعد حذف Partner
  const navItems = [
    ["Home", "/#hero", "hero"],
    ["About", "/#mission", "mission"],
    ["Features", "/#features", "features"],
    ["How", "/#how", "how"],
    ["Articles", "/articles", "articles"],
  ];

  // ✅ حل مشكلة التنقل من صفحة articles
  const handleNavClick = (e, href, id) => {
    // Articles: خلّي Next يروح طبيعي
    if (id === "articles") {
      setIsMenuOpen(false);
      return;
    }

    // إذا مو بالهوم، خلّي Next يودينا للـ "/#id"
    if (pathname !== "/") {
      setIsMenuOpen(false);
      return;
    }

    // إذا بالهوم: scroll smooth + prevent default
    if (href.startsWith("/#")) {
      e.preventDefault();
      setIsMenuOpen(false);
      smoothScrollToId(id);

      // تحديث الـ url بالـ hash بدون reload
      try {
        history.replaceState(null, "", href);
      } catch (err) {}
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600">
            Health<span className="text-gray-800">Sight</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-700">
            {navItems.map(([label, href, id]) => {
              const isActive = id === "articles" ? pathname === "/articles" : activeSection === id;
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={(e) => handleNavClick(e, href, id)}
                  className={`relative group px-2 py-2 ${isActive ? "text-indigo-600" : ""}`}
                >
                  {label}
                  <span
                    className={`absolute left-0 bottom-0 h-0.5 bg-indigo-600 transition-all duration-200 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {!isMounted || loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <UserProfile />
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="transform transition-transform duration-150 hover:scale-105 rounded-md border border-indigo-300 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                >
                  Login
                </button>
                <button
                  onClick={openRegisterModal}
                  className="transform transition-transform duration-150 hover:scale-105 rounded-full bg-pink-500 px-4 py-2 text-sm text-white hover:bg-pink-600"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-md bg-gray-100 p-2 hover:bg-gray-200"
            >
              ☰
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-20 bg-white border-b border-gray-200 shadow-lg">
            <nav className="flex flex-col p-6 space-y-4 items-center">
              {navItems.map(([label, href, id]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={(e) => handleNavClick(e, href, id)}
                  className="w-full text-center py-3 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                >
                  {label}
                </Link>
              ))}

              {(!isMounted || loading) ? (
                <div className="w-full flex gap-3 pt-4 border-t w-full justify-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              ) : user ? (
                <div className="w-full pt-4 border-t flex flex-col items-center">
                  <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-3 justify-center py-3">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">{profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || 'U'}</div>
                    )}

                    <div className="flex flex-col text-center">
                      <span className="text-sm font-medium">{profile?.full_name || 'Profile'}</span>
                      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">{roleLabel}</span>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-3 pt-4 border-t w-full justify-center">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      openLoginModal();
                    }}
                    className="transform transition-transform duration-150 hover:scale-105 rounded-md border border-indigo-300 px-6 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      openRegisterModal();
                    }}
                    className="transform transition-transform duration-150 hover:scale-105 rounded-full bg-pink-500 px-6 py-2 text-sm text-white hover:bg-pink-600"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* ✅ المودلات مع السويتش */}
      <LoginForm open={isLoginOpen} onClose={closeAll} onShowRegister={switchToRegister} />
      <RegisterForm open={isRegisterOpen} onClose={closeAll} onShowLogin={switchToLogin} />
    </header>
  );
}
