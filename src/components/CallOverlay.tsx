"use client";

import { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import type { ActiveCall } from "@/hooks/useCall";

interface CallOverlayProps {
  call: ActiveCall;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleCam: () => void;
}

export function CallOverlay({ call, onEnd, onToggleMute, onToggleCam }: CallOverlayProps) {
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && call.remoteStream) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
  }, [call.remoteStream]);

  const isVideo = call.type === "video";

  return (
    <div className="fixed inset-0 z-[90] bg-[#0a0812] flex flex-col">
      {/* Top stripe */}
      <div className="top-stripe" />

      {/* Main area */}
      <div className="flex-1 flex items-center justify-center relative">
        {isVideo ? (
          <>
            {/* Remote video — full background */}
            {call.remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-[#7a6d94]">
                <Avatar name={call.peerUser.name} size="lg" />
                <p className="text-sm font-syne">
                  {call.state === "calling" ? "Calling…" : "Connecting…"}
                </p>
              </div>
            )}

            {/* Local video — pip */}
            <div className="absolute bottom-6 right-6 w-32 h-24 rounded-xl overflow-hidden border border-[#252040] shadow-xl bg-[#16132a]">
              {!call.isCamOff ? (
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Avatar name="You" size="sm" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio call — centered avatar */
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <span className="absolute inset-0 rounded-full border-2 border-[#c084fc]/20 animate-ping" />
              <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-[#9d5bf4]/40">
                <Avatar name={call.peerUser.name} size="lg" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white font-syne">{call.peerUser.name}</h2>
              <p className="text-sm text-[#7a6d94] mt-1">
                {call.state === "calling" ? "Calling…" : call.state === "active" ? "Connected" : "Connecting…"}
              </p>
            </div>

            {/* Audio waveform visual */}
            {call.state === "active" && (
              <div className="flex items-end gap-1 h-8">
                {[3, 6, 9, 5, 7, 10, 4, 8, 6, 3, 7, 5, 9].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-[#9d5bf4]/60"
                    style={{
                      height: `${h * 2}px`,
                      animation: `pulse-bar 0.8s ease-in-out ${i * 0.07}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="pb-8 pt-4 flex items-center justify-center gap-5">
        {/* Mute */}
        <button
          onClick={onToggleMute}
          title={call.isMuted ? "Unmute" : "Mute"}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
            call.isMuted
              ? "bg-[#9d5bf4]/30 border-[#9d5bf4]/60 text-[#c084fc]"
              : "bg-[#1c1830] border-[#2e2950] text-[#7a6d94] hover:border-[#9d5bf4]/40"
          }`}
        >
          {call.isMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
              <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 20v4M8 24h8"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v5M8 24h8"/>
            </svg>
          )}
        </button>

        {/* Cam (video only) */}
        {isVideo && (
          <button
            onClick={onToggleCam}
            title={call.isCamOff ? "Turn on camera" : "Turn off camera"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
              call.isCamOff
                ? "bg-[#9d5bf4]/30 border-[#9d5bf4]/60 text-[#c084fc]"
                : "bg-[#1c1830] border-[#2e2950] text-[#7a6d94] hover:border-[#9d5bf4]/40"
            }`}
          >
            {call.isCamOff ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10M1 1l22 22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
            )}
          </button>
        )}

        {/* Hang up */}
        <button
          onClick={onEnd}
          title="End call"
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition shadow-lg shadow-red-500/30"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="rotate-[135deg]">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.08 9.8 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.64a16 16 0 006 6l1.01-1.01a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse-bar {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
