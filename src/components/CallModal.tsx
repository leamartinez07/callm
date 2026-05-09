"use client";

import { Avatar } from "./Avatar";
import type { CallOffer } from "@/types";

interface CallModalProps {
  incoming: CallOffer;
  onAnswer: () => void;
  onReject: () => void;
}

export function CallModal({ incoming, onAnswer, onReject }: CallModalProps) {
  const isVideo = incoming.type === "video";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#16132a] border border-[#252040] rounded-2xl p-8 w-full max-w-xs text-center shadow-[0_0_60px_rgba(157,91,244,0.2)]">
        {/* Animated ring */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          <span className="absolute inset-0 rounded-full border-2 border-[#c084fc]/30 animate-ping" />
          <span className="absolute inset-1 rounded-full border border-[#c084fc]/20 animate-ping [animation-delay:0.3s]" />
          <div className="relative w-20 h-20 rounded-full overflow-hidden">
            <Avatar name={incoming.from.name} size="lg" />
          </div>
        </div>

        <p className="text-xs text-[#7a6d94] uppercase tracking-widest font-syne mb-1">
          {isVideo ? "Video call" : "Audio call"}
        </p>
        <h2 className="text-lg font-bold text-white font-syne mb-1">{incoming.from.name}</h2>
        <p className="text-sm text-[#7a6d94] mb-8">incoming {isVideo ? "video" : "audio"} call…</p>

        <div className="flex gap-4 justify-center">
          {/* Reject */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-1.5 group"
            aria-label="Reject"
          >
            <span className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center group-hover:bg-red-500/40 transition">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400 rotate-[135deg]">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.08 9.8 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.64a16 16 0 006 6l1.01-1.01a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
            </span>
            <span className="text-xs text-red-400">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={onAnswer}
            className="flex flex-col items-center gap-1.5 group"
            aria-label="Answer"
          >
            <span className="w-14 h-14 rounded-full bg-[#9d5bf4]/20 border border-[#9d5bf4]/40 flex items-center justify-center group-hover:bg-[#9d5bf4]/40 transition">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#c084fc]">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.08 9.8 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.64a16 16 0 006 6l1.01-1.01a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
            </span>
            <span className="text-xs text-[#c084fc]">Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
