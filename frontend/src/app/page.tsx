"use client";

import { useState, useEffect } from 'react';
import { useMediaQuery } from '../services/hooks/useMediaQuery';
import { MobileApp } from '../components/views/MobileApp';
import { DesktopApp } from '../components/views/DesktopApp';
import Navbar from '../components/Navbar';

export default function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by waiting for first client render
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center">
        {/* Simple placeholder loader */}
        <div className="animate-pulse w-12 h-12 bg-gray-300 rounded-full mb-4"></div>
        <div className="animate-pulse h-4 bg-gray-300 w-24 rounded"></div>
      </div>
    );
  }

  return isDesktop ? <DesktopApp /> : <MobileApp />;
}
