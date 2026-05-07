"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IconChat } from "@/components/icons";
import { Sidebar } from "@/components/Sidebar";
import { ChatRoom } from "@/components/ChatRoom";
import { useAuth } from "@/hooks/useAuth";
import type { IRoom, IMessage } from "@/types";
import Pusher from "pusher-js";
import { CHANNELS, EVENTS } from "@/lib/pusher";

export default function ChatPage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<IRoom | null>(null);
  const [initialMessages, setInitialMessages] = useState<IMessage[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      setCurrentUser(user);
    }
  }, [loading, user, router]);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/rooms?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setRooms(json.data);
    } finally {
      setRoomsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchRooms();
  }, [token, fetchRooms]);

  // Listen for new rooms via Pusher global channel
  useEffect(() => {
    if (!token) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("chatflow_token", token);
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(CHANNELS.global);
    channel.bind(EVENTS.ROOM_CREATED, ({ room }: { room: IRoom }) => {
      setRooms((prev) => {
        if (prev.some((r) => r._id === room._id)) return prev;
        return [room, ...prev];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNELS.global);
      pusher.disconnect();
    };
  }, [token]);

  // roomOverride: pass room directly to avoid state-timing issues
  async function selectRoom(roomId: string, roomOverride?: IRoom) {
    const room = roomOverride ?? rooms.find((r) => r._id === roomId);
    if (!room) return;
    setActiveRoom(room);

    // Fetch initial messages
    const res = await fetch(`/api/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) setInitialMessages(json.data);
  }

  async function createRoom(name: string, description?: string) {
    if (!token) return;
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });
    const json = await res.json();
    if (json.success) {
      // Dedup: Pusher may have already added it via ROOM_CREATED event
      setRooms((prev) => {
        if (prev.some((r) => r._id === json.data._id)) return prev;
        return [json.data, ...prev];
      });
      // Pass room directly — state update is async, rooms[] not yet updated
      await selectRoom(json.data._id, json.data);
    }
  }

  async function joinRoom(roomId: string) {
    if (!token) return;
    // Grab room from current state BEFORE the async fetch (avoids stale closure after fetchRooms)
    const roomOverride = rooms.find((r) => r._id === roomId);
    const res = await fetch(`/api/rooms/${roomId}/members`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) {
      await fetchRooms();
      // Pass room directly — state from fetchRooms may not be applied yet
      if (roomOverride) await selectRoom(roomId, roomOverride);
    }
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (loading || roomsLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-zinc-500">
          <IconChat width={20} height={20} className="text-accent animate-pulse" />
          <span className="text-sm">Loading ChatFlow…</span>
        </div>
      </div>
    );
  }

  if (!currentUser || !token) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      <Sidebar
        user={currentUser}
        rooms={rooms}
        activeRoomId={activeRoom?._id}
        onSelectRoom={selectRoom}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onLogout={handleLogout}
        currentUserId={currentUser._id}
        token={token}
        onUserUpdate={setCurrentUser}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeRoom ? (
          <ChatRoom
            room={activeRoom}
            token={token}
            currentUserId={currentUser._id}
            initialMessages={initialMessages}
            onRoomDeleted={(roomId) => {
              setRooms((prev) => prev.filter((r) => r._id !== roomId));
              setActiveRoom(null);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <IconChat width={28} height={28} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Welcome to ChatFlow
            </h2>
            <p className="text-sm text-zinc-500 max-w-xs">
              Select a room from the sidebar to start chatting, or create a new one.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
