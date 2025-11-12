"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LoginForm from "./Auth/LoginForm";
import RegisterForm from "./Auth/RegisterForm";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "mission", "features", "how", "collab", "testimonials", "cta"];
      const current = sections.find((section) => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    ["Home", "/#hero", "hero"],
    ["About", "/#mission", "mission"],
    ["Features", "/#features", "features"],
    ["Partners", "/#how", "how"],
    ["Articles", "/articles", "articles"],
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600">Health<span className="text-gray-800">Sight</span></div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-700">
            {navItems.map(([label, href, id]) => {
              const isActive = id === "articles" ? pathname === "/articles" : activeSection === id;
              return (
                <Link key={label} href={href} className={`relative group px-2 py-2 ${isActive ? "text-indigo-600" : ""}`}>
                  {label}
                  <span className={`absolute left-0 bottom-0 h-0.5 bg-indigo-600 transition-all duration-200 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}></span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => setIsLoginOpen(true)} className="transform transition-transform duration-150 hover:scale-105 rounded-md border border-indigo-300 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50">Login</button>
            <button onClick={() => setIsRegisterOpen(true)} className="transform transition-transform duration-150 hover:scale-105 rounded-full bg-pink-500 px-4 py-2 text-sm text-white hover:bg-pink-600">Sign Up</button>
          </div>

          <div className="lg:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-md bg-gray-100 p-2 hover:bg-gray-200">☰</button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-20 bg-white border-b border-gray-200 shadow-lg">
            <nav className="flex flex-col p-6 space-y-4 items-center">
              {navItems.map(([label, href]) => (
                <Link key={label} href={href} className="w-full text-center py-3 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">{label}</Link>
              ))}

              <div className="flex gap-3 pt-4 border-t w-full justify-center">
                <button onClick={() => setIsLoginOpen(true)} className="transform transition-transform duration-150 hover:scale-105 rounded-md border border-indigo-300 px-6 py-2 text-sm text-indigo-700 hover:bg-indigo-50">Login</button>
                <button onClick={() => setIsRegisterOpen(true)} className="transform transition-transform duration-150 hover:scale-105 rounded-full bg-pink-500 px-6 py-2 text-sm text-white hover:bg-pink-600">Sign Up</button>
              </div>
            </nav>
          </div>
        )}
      </div>

      <LoginForm open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <RegisterForm open={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </header>
  );
}
