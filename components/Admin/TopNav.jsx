"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function TopNav({ active, onChange }) {
  const tabs = [
    { id: 'map', label: 'Outbreaks Map' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'users', label: 'Users' },
    { id: 'articles', label: 'Articles' }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold text-blue-600">Health<span className="text-gray-900">Sight</span></h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <img src="/user-avatar.jpg" alt="admin" className="h-10 w-10 rounded-full object-cover" />
            <div className="text-sm">
              <div className="font-medium">Noor Ahmed</div>
              <div className="text-xs text-white bg-indigo-600 inline-block px-2 py-0.5 rounded-full">Admin</div>
            </div>
          </div>
          <button aria-label="notifications" className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center">🔔</button>
        </div>
      </div>

      <nav className="mt-6">
        <div className="rounded-full bg-indigo-50 p-1">
          <div className="mx-auto max-w-5xl px-4">
            <div className="relative flex items-center justify-between">
              {tabs.map((t) => (
                <div key={t.id} className="relative">
                  {active === t.id && (
                    <motion.div
                      layoutId="nav-pill"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute inset-0 m-0 rounded-full bg-indigo-600"
                      style={{ zIndex: 0 }}
                    />
                  )}

                  <button
                    onClick={() => onChange(t.id)}
                    className={`relative z-10 py-2 px-6 rounded-full text-sm font-medium transition-colors duration-200 ${active===t.id ? 'text-white' : 'text-gray-700 hover:text-gray-900'}`}>
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
