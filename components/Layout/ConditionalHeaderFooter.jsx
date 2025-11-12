"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '../Header';
import Footer from '../Footer';

export default function ConditionalHeaderFooter({ children }) {
  const pathname = usePathname();

  // Show header/footer on landing and articles pages
  const showHeaderFooter = pathname === '/' || pathname === '' || pathname == null || pathname.startsWith('/articles');

  return (
    <>
      {showHeaderFooter && <Header />}
      {children}
      {showHeaderFooter && <Footer />}
    </>
  );
}
