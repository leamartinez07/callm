"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient, CHANNELS, EVENTS } from "@/lib/pusher";
import type { IMessage } from "@/types";

interface UseChatOptions {
  roomId: string;
  token: string;
  initialMessages?: IMessage[];
}

export function useChat({ roomId, token, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState<IMessage[]>(initialMessages);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof getPusherClient>["subscribe"]> | null>(null);

  useEffect(() => {
    if (!roomId || !token) return;

    // Update auth token in Pusher client
    if (typeof window !== "undefined") {
      localStorage.setItem("chatflow_token", token);
    }

    const pusher = getPusherClient();
    const channelName = CHANNELS.room(roomId);

    // Unsubscribe from previous channel
    if (channelRef.current) {
      channelRef.current.unbind_all();
      pusher.unsubscribe(channelName);
    }

    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", (members: { count: number }) => {
      setIsConnected(true);
      setOnlineCount(members.count);
    });

    channel.bind("pusher:member_added", () => {
      setOnlineCount((n) => n + 1);
    });

    channel.bind("pusher:member_removed", () => {
      setOnlineCount((n) => Math.max(0, n - 1));
    });

    channel.bind(EVENTS.NEW_MESSAGE, ({ message }: { message: IMessage }) => {
      setMessages((prev) => [...prev, message]);
    });

    channel.bind(EVENTS.MESSAGE_EDITED, ({ message }: { message: IMessage }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m))
      );
    });

    channel.bind(EVENTS.MESSAGE_DELETED, ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      setIsConnected(false);
    };
  }, [roomId, token]);

  const loadMore = useCallback(
    async (before?: string) => {
      const url = `/api/rooms/${roomId}/messages${before ? `?before=${before}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [...json.data, ...prev]);
        return json.meta?.hasMore as boolean;
      }
      return false;
    },
    [roomId, token]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
    },
    [roomId, token]
  );

  return { messages, onlineCount, isConnected, loadMore, sendMessage };
}
