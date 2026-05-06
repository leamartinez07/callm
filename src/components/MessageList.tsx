"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { IMessage } from "@/types";

interface MessageListProps {
  messages: IMessage[];
  currentUserId: string;
  onLoadMore: () => Promise<boolean>;
}

export function MessageList({ messages, currentUserId, onLoadMore }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAutoScrolling.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Intersection observer for "load more" trigger
  useEffect(() => {
    const el = topRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore]);

  return (
    <div
      className="flex-1 overflow-y-auto py-4 space-y-0.5"
      onScroll={(e) => {
        const el = e.currentTarget;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isAutoScrolling.current = distFromBottom < 100;
      }}
    >
      <div ref={topRef} className="h-1" />

      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-zinc-500 text-sm">No messages yet. Say hello! 👋</p>
        </div>
      )}

      {messages.map((msg, i) => {
        const prevMsg = messages[i - 1];
        const prevSenderId =
          typeof prevMsg?.sender === "string" ? prevMsg.sender : prevMsg?.sender?._id;
        const currSenderId = typeof msg.sender === "string" ? msg.sender : msg.sender._id;

        const showSender =
          !prevMsg ||
          prevSenderId !== currSenderId ||
          new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000;

        const isOwn = currSenderId === currentUserId;

        return (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={isOwn}
            showSender={showSender}
          />
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
