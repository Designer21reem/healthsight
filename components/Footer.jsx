import React from "react";
import Link from "next/link";

export default function Footer(){
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <div className="text-xl font-bold text-indigo-600">Health<span className="text-gray-800">Sight</span></div>
            <p className="text-sm text-gray-500">Be part of a smarter, safer, and more proactive healthcare ecosystem.</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/">Home</Link>
            <a href="#mission" className="hover:text-indigo-600">About</a>
            <a href="#features" className="hover:text-indigo-600">Features</a>
            <a href="#how" className="hover:text-indigo-600">Partners</a>
            <Link href="/articles">Articles</Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-gray-400">© {new Date().getFullYear()} Predictive Disease Outbreak Platform. All Rights Reserved.</div>
      </div>
    </footer>
  )
}
