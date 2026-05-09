"use client";

import { useState } from "react";
import { IconHash, IconPeople, IconChevronLeft, IconOnline, IconOffline, IconInfo } from "./icons";
import { Avatar } from "./Avatar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { useChat } from "@/hooks/useChat";
import { useLocale } from "@/hooks/useLocale";
import type { IRoom, IMessage, IUser, CallType } from "@/types";
import { clsx } from "clsx";

interface ChatRoomProps {
  room: IRoom;
  token: string;
  currentUserId: string;
  currentUser?: IUser;
  initialMessages?: IMessage[];
  onBack?: () => void;
  onInfoClick?: () => void;
  onRoomDeleted?: (roomId: string) => void;
  onStartCall?: (type: CallType) => void;
}

export function ChatRoom({
  room,
  token,
  currentUserId,
  currentUser,
  initialMessages = [],
  onBack,
  onInfoClick,
  onRoomDeleted,
  onStartCall,
}: ChatRoomProps) {
  const { t } = useLocale();
  const [currentRoom, setCurrentRoom] = useState(room);
  const [showInfo, setShowInfo] = useState(false);
  const { messages, onlineCount, isConnected, loadMore, sendMessage, editMessage, deleteMessage } = useChat({
    roomId: room._id,
    token,
    initialMessages,
  });

  const isDM = room.type === "direct";
  const peerUser = isDM
    ? (room.members as IUser[]).find((m) => {
        const id = typeof m === "string" ? m : m._id;
        return id !== currentUserId;
      }) as IUser | undefined
    : undefined;
  const displayName = isDM && peerUser?.name ? peerUser.name : currentRoom.name;

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

          {/* Icon: avatar for DMs, hash for rooms */}
          {isDM && peerUser ? (
            <div className="h-9 w-9 rounded-full overflow-hidden shrink-0">
              <Avatar name={peerUser.name} size="sm" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-accent/10 shrink-0">
              <IconHash width={16} height={16} className="text-accent" />
            </div>
          )}

          <div className={clsx("flex-1 min-w-0", !isDM && "cursor-pointer hover:opacity-70 transition")}>
            {isDM ? (
              <div>
                <h2 className="text-sm font-semibold text-white truncate">{displayName}</h2>
                <p className="text-xs text-[#7a6d94]">{t("directMessage")}</p>
              </div>
            ) : (
              <button
                onClick={handleInfoClick}
                className="w-full text-left"
                title="View room info"
              >
                <h2 className="text-sm font-semibold text-white truncate">{displayName}</h2>
                {currentRoom.description && (
                  <p className="text-xs text-zinc-500 truncate">{currentRoom.description}</p>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Call buttons — DMs only */}
            {isDM && onStartCall && (
              <>
                <button
                  onClick={() => onStartCall("audio")}
                  title="Audio call"
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#1c1830] border border-[#2e2950] text-[#7a6d94] hover:border-[#9d5bf4]/50 hover:text-[#c084fc] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.08 9.8 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.64a16 16 0 006 6l1.01-1.01a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                  </svg>
                </button>

                <button
                  onClick={() => onStartCall("video")}
                  title="Video call"
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#1c1830] border border-[#2e2950] text-[#7a6d94] hover:border-[#9d5bf4]/50 hover:text-[#c084fc] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                </button>
              </>
            )}

            {/* Connection / member count — group rooms only */}
            {!isDM && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  {isConnected ? (
                    <IconOnline width={12} height={12} className="text-emerald-400" />
                  ) : (
                    <IconOffline width={12} height={12} className="text-zinc-600" />
                  )}
                  <span className={isConnected ? "text-emerald-400" : "text-zinc-600"}>
                    {isConnected ? `${onlineCount} ${t("online")}` : t("connecting")}
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
              </>
            )}
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

      {/* Room info panel — group rooms only */}
      {showInfo && !isDM && (
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
