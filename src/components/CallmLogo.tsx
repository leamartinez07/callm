"use client";

import React from "react";

interface CallmLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

/**
 * callm logo — circle (calm/halo) + sine wave (call/audio signal)
 * Wordmark: "callm" in Syne, gradient lila→pink
 */
export function CallmLogo({ size = "md", showText = true, className = "" }: CallmLogoProps) {
  const px = { sm: 20, md: 26, lg: 38 }[size];
  const textSize = { sm: "text-sm", md: "text-[15px]", lg: "text-xl" }[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <svg width={px} height={px} viewBox="0 0 32 32" fill="none" aria-label="callm logo">
        {/* Outer ring — calm / halo */}
        <circle
          cx="16" cy="16" r="11.5"
          stroke="url(#callm-ring)"
          strokeWidth="2"
          fill="none"
        />
        {/* Sine wave — call / audio signal */}
        <path
          d="M5 16 Q7.5 10.5 10 16 Q12.5 21.5 15 16 Q17.5 10.5 20 16 Q22.5 21.5 25 16 Q26.2 13 27 16"
          stroke="url(#callm-wave)"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
        <defs>
          <linearGradient id="callm-ring" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          <linearGradient id="callm-wave" x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c084fc" stopOpacity="0.55" />
            <stop offset="50%"  stopColor="#e879f9" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span
          className={`font-syne font-bold tracking-tight leading-none ${textSize}`}
          style={{
            background: "linear-gradient(135deg, #c084fc 0%, #e879f9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          callm
        </span>
      )}
    </div>
  );
}
