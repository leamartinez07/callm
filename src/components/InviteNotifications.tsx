"use client";

import { useState, useEffect } from "react";
import { IconBell, IconCheck, IconX } from "./icons";
import { Avatar } from "./Avatar";
import type { IInvite } from "@/types";
import { clsx } from "clsx";

interface InviteNotificationsProps {
  token: string;
  currentUserId: string;
}

export function InviteNotifications({ token, currentUserId }: InviteNotificationsProps) {
  const [invites, setInvites] = useState<IInvite[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    // Fetch invites on mount and every 30s
    const fetchInvites = async () => {
      try {
        const res = await fetch("/api/invites", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setInvites(data.data);
        }
      } catch (e) {
        console.error("Error fetching invites:", e);
      }
    };

    fetchInvites();
    const interval = setInterval(fetchInvites, 30000);
    return () => clearInterval(interval);
  }, [token]);

  async function handleRespond(inviteId: string, status: "accepted" | "declined") {
    setResponding(inviteId);
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setInvites(invites.filter((i) => i._id !== inviteId));
      }
    } finally {
      setResponding(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
        title="Invites"
      >
        <IconBell width={16} height={16} />
        {invites.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {invites.length > 9 ? "9+" : invites.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface-1 border border-white/10 rounded-xl shadow-lg z-40 max-h-96 overflow-y-auto">
          {invites.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-600">
              No pending invites
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {invites.map((invite) => {
                const fromName = typeof invite.from === "string" ? "Unknown" : invite.from.name || "Unknown";
                const fromAvatar = typeof invite.from === "string" ? undefined : invite.from.avatar;
                const roomName = typeof invite.room === "string" ? "Unknown" : (invite.room?.name ?? "Unknown");

                const message =
                  invite.type === "friend"
                    ? `${fromName} wants to be your friend`
                    : `${fromName} invited you to #${roomName}`;

                return (
                  <div key={invite._id} className="p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <Avatar
                        name={fromName}
                        src={fromAvatar}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200">{message}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(invite._id, "accepted")}
                        disabled={responding === invite._id}
                        className="flex-1 h-7 flex items-center justify-center gap-1 text-xs font-semibold bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition disabled:opacity-50"
                      >
                        <IconCheck width={12} height={12} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(invite._id, "declined")}
                        disabled={responding === invite._id}
                        className="flex-1 h-7 flex items-center justify-center gap-1 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition disabled:opacity-50"
                      >
                        <IconX width={12} height={12} />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
