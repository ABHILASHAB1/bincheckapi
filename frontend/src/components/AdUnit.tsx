"use client";

import React, { useEffect, useState } from 'react';

interface AdUnitProps {
  type?: 'banner' | 'sidebar' | 'inline';
  className?: string;
}

export default function AdUnit({ type = 'banner', className = '' }: AdUnitProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Avoid hydration mismatch

  let dims = "w-full h-[90px] max-w-[728px]"; // Default leaderboard banner
  if (type === 'sidebar') dims = "w-[300px] h-[600px]"; // Half-page ad
  if (type === 'inline') dims = "w-full h-[250px] max-w-[300px]"; // Medium rectangle

  return (
    <div className={`mx-auto flex justify-center items-center my-8 ${className}`}>
      {/* 
        NOTE FOR THE FUTURE: 
        When you get approved for Google AdSense, replace this entire div inside the return 
        with the <ins> tag provided by Google AdSense, and add the appropriate 
        (window.adsbygoogle = window.adsbygoogle || []).push({}); script call in useEffect.
      */}
      <div 
        className={`${dims} bg-slate-100 border border-slate-200 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 relative overflow-hidden`}
      >
        <div className="absolute top-2 left-2 text-[10px] uppercase tracking-widest font-bold text-slate-300">
          Advertisement
        </div>
        <i className="ph-bold ph-megaphone text-3xl mb-2 opacity-50"></i>
        <span className="text-sm font-medium">Ad Space Reserved</span>
      </div>
    </div>
  );
}
