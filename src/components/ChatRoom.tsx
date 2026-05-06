"use client";

import { useEffect, useState } from "react";
import { Hash, Users, ChevronLeft, Wifi, WifiOff } from "lucide-react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChat } from "@/hooks/useChat";
import type { IRoom, IMessage } from "@/types";

interface ChatRoomProps {
  room: IRoom;
  token: string;
  currentUserId: string;
  initialMessages?: IMessage[];
  onBack?: () => void;
}

export function ChatRoom({ room, token, currentUserId, initialMessages = [], onBack }: ChatRoomProps) {
  const { messages, onlineCount, isConnected, loadMore, sendMessage } = useChat({
    roomId: room._id,
    token,
    initialMessages,
  });

  const [loadedMessages, setLoadedMessages] = useState(messages);

  useEffect(() => {
    setLoadedMessages(messages);
  }, [messages]);

  async function handleLoadMore() {
    const oldest = loadedMessages[0];
    return loadMore(oldest?._id);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-surface-1/50">
        {onBack && (
          <button
            onClick={onBack}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition md:hidden"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-accent/10 shrink-0">
          <Hash size={16} className="text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">{room.name}</h2>
          {room.description && (
            <p className="text-xs text-zinc-500 truncate">{room.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            {isConnected ? (
              <Wifi size={12} className="text-emerald-400" />
            ) : (
              <WifiOff size={12} className="text-zinc-600" />
            )}
            <span className={isConnected ? "text-emerald-400" : "text-zinc-600"}>
              {isConnected ? `${onlineCount} online` : "connecting…"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Users size={12} />
            <span>{room.memberCount}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onLoadMore={handleLoadMore}
      />

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={!isConnected && messages.length > 0} />
    </div>
  );
}
