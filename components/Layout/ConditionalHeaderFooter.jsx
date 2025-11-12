"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '../Header';
import Footer from '../Footer';

export default function ConditionalHeaderFooter({ children }) {
  const pathname = usePathname();

  // Hide header/footer for admin routes
  const isAdmin = pathname && pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Header />}
      {children}
      {!isAdmin && <Footer />}
    </>
  );
}
