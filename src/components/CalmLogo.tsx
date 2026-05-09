"use client";

import React from "react";

interface CalmLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

/** calLM — ring icon + wordmark: "cal" plain + "LM" in lila→pink gradient */
export function CalmLogo({ size = "md", showText = true, className = "" }: CalmLogoProps) {
  const px = { sm: 22, md: 28, lg: 40 }[size];
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-xl" }[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Ring/halo icon */}
      <svg width={px} height={px} viewBox="0 0 32 32" fill="none" aria-hidden>
        {/* Outer ring */}
        <circle cx="16" cy="16" r="11" stroke="url(#lg)" strokeWidth="2.4" fill="none" />
        {/* Inner dot */}
        <circle cx="16" cy="16" r="3.5" fill="url(#lg)" />
        {/* Accent arc — like a signal wave */}
        <path d="M23.5 9A9.5 9.5 0 0 1 25.5 16" stroke="#e879f9" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.65" />
        <defs>
          <linearGradient id="lg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span className={`font-syne font-bold tracking-tight leading-none ${textSize}`}>
          <span className="text-white/80">cal</span>
          <span style={{
            background: "linear-gradient(135deg, #c084fc 0%, #e879f9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            LM
          </span>
        </span>
      )}
    </div>
  );
}
