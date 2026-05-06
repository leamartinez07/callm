"use client";

import { format, isToday, isYesterday } from "date-fns";
import { Avatar } from "./Avatar";
import type { IMessage } from "@/types";
import { clsx } from "clsx";

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  showSender: boolean; // show avatar + name when first in a group
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "d MMM HH:mm");
}

export function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const senderName = typeof message.sender === "string" ? message.sender : message.sender.name;
  const senderAvatar = typeof message.sender === "string" ? undefined : message.sender.avatar;

  return (
    <div className={clsx("flex gap-2.5 px-4 py-0.5", isOwn && "flex-row-reverse", !showSender && "mt-0.5")}>
      {/* Avatar placeholder to keep alignment */}
      {showSender ? (
        <Avatar name={senderName} src={senderAvatar} size="sm" />
      ) : (
        <div className="w-7 shrink-0" />
      )}

      <div className={clsx("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        {showSender && (
          <div className={clsx("flex items-baseline gap-2 mb-0.5", isOwn && "flex-row-reverse")}>
            <span className="text-xs font-semibold text-zinc-300">{senderName}</span>
            <span className="text-[10px] text-zinc-600">{formatTime(message.createdAt)}</span>
          </div>
        )}
        <div
          className={clsx(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
            isOwn
              ? "bg-accent text-white rounded-tr-sm"
              : "bg-surface-2 text-zinc-200 rounded-tl-sm"
          )}
        >
          {message.content}
        </div>
        {!showSender && (
          <span className={clsx("text-[10px] text-zinc-600 mt-0.5 px-1", isOwn && "text-right")}>
            {formatTime(message.createdAt)}
          </span>
        )}
        {message.editedAt && (
          <span className="text-[10px] text-zinc-600 px-1">(edited)</span>
        )}
      </div>
    </div>
  );
}
