"use client";

import { useState } from "react";
import { IconHash, IconPeople, IconChevronLeft, IconOnline, IconOffline, IconInfo } from "./icons";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { useChat } from "@/hooks/useChat";
import type { IRoom, IMessage } from "@/types";
import { clsx } from "clsx";

interface ChatRoomProps {
  room: IRoom;
  token: string;
  currentUserId: string;
  initialMessages?: IMessage[];
  onBack?: () => void;
  onInfoClick?: () => void;
  onRoomDeleted?: (roomId: string) => void;
}

export function ChatRoom({ room, token, currentUserId, initialMessages = [], onBack, onInfoClick, onRoomDeleted }: ChatRoomProps) {
  const [currentRoom, setCurrentRoom] = useState(room);
  const [showInfo, setShowInfo] = useState(false);
  const { messages, onlineCount, isConnected, loadMore, sendMessage, editMessage, deleteMessage } = useChat({
    roomId: room._id,
    token,
    initialMessages,
  });

  async function handleLoadMore() {
    const oldest = messages[0];
    return loadMore(oldest?._id);
  }

  function handleInfoClick() {
    setShowInfo(true);
    onInfoClick?.();
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Room header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-surface-1/50">
          {onBack && (
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition md:hidden"
            >
              <IconChevronLeft width={18} height={18} />
            </button>
          )}

          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-accent/10 shrink-0">
            <IconHash width={16} height={16} className="text-accent" />
          </div>

          <button
            onClick={handleInfoClick}
            className={clsx(
              "flex-1 min-w-0 text-left hover:opacity-70 transition",
              "cursor-pointer"
            )}
            title="View room info"
          >
            <h2 className="text-sm font-semibold text-white truncate">{currentRoom.name}</h2>
            {currentRoom.description && (
              <p className="text-xs text-zinc-500 truncate">{currentRoom.description}</p>
            )}
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              {isConnected ? (
                <IconOnline width={12} height={12} className="text-emerald-400" />
              ) : (
                <IconOffline width={12} height={12} className="text-zinc-600" />
              )}
              <span className={isConnected ? "text-emerald-400" : "text-zinc-600"}>
                {isConnected ? `${onlineCount} online` : "connecting…"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <IconPeople width={12} height={12} />
              <span>{currentRoom.memberCount}</span>
            </div>

            <button
              onClick={handleInfoClick}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
              title="Room info"
            >
              <IconInfo width={16} height={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onLoadMore={handleLoadMore}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          roomId={room._id}
          token={token}
        />

        {/* Input */}
        <MessageInput onSend={sendMessage} disabled={!isConnected && messages.length > 0} token={token} />
      </div>

      {/* Room info panel */}
      {showInfo && (
        <RoomInfoPanel
          room={currentRoom}
          currentUserId={currentUserId}
          token={token}
          onClose={() => setShowInfo(false)}
          onUpdate={setCurrentRoom}
          onDelete={() => { onRoomDeleted?.(room._id); onBack?.(); }}
        />
      )}
    </>
  );
}
