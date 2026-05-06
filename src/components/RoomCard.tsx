"use client";

import { Hash, Lock, Users } from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";
import type { IRoom } from "@/types";

interface RoomCardProps {
  room: IRoom;
  isActive?: boolean;
  isMember?: boolean;
  onClick: () => void;
}

export function RoomCard({ room, isActive, isMember, onClick }: RoomCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all group",
        isActive ? "bg-accent/20 text-white" : "hover:bg-white/5 text-zinc-400"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={clsx(
            "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
            isActive ? "bg-accent/30" : "bg-white/5"
          )}
        >
          {room.type === "private" ? (
            <Lock size={14} className={isActive ? "text-accent" : "text-zinc-500"} />
          ) : (
            <Hash size={14} className={isActive ? "text-accent" : "text-zinc-500"} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 justify-between">
            <span className={clsx("text-sm font-medium truncate", isActive ? "text-white" : "text-zinc-300")}>
              {room.name}
            </span>
            {room.lastMessage && (
              <span className="text-[10px] text-zinc-600 shrink-0">
                {format(new Date(room.lastMessage.createdAt), "HH:mm")}
              </span>
            )}
          </div>

          {room.lastMessage ? (
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              <span className="text-zinc-600">{room.lastMessage.sender}: </span>
              {room.lastMessage.content}
            </p>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <Users size={10} className="text-zinc-600" />
              <span className="text-[11px] text-zinc-600">{room.memberCount} members</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
