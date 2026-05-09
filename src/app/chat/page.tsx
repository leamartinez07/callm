"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChatRoom } from "@/components/ChatRoom";
import { CallModal } from "@/components/CallModal";
import { CallOverlay } from "@/components/CallOverlay";
import { CallmLogo } from "@/components/CallmLogo";
import { useAuth } from "@/hooks/useAuth";
import { useCall } from "@/hooks/useCall";
import { useLocale } from "@/hooks/useLocale";
import type { IRoom, IMessage, IFriend } from "@/types";
import Pusher from "pusher-js";
import { CHANNELS, EVENTS } from "@/lib/pusher";

export default function ChatPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { user, token, loading, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [rooms, setRooms]         = useState<IRoom[]>([]);
  const [dms, setDMs]             = useState<IRoom[]>([]);
  const [friends, setFriends]     = useState<IFriend[]>([]);
  const [activeRoom, setActiveRoom]       = useState<IRoom | null>(null);
  const [initialMessages, setInitialMessages] = useState<IMessage[]>([]);
  const [roomsLoading, setRoomsLoading]   = useState(true);

  const { call, incomingCall, startCall, answerCall, rejectCall, endCall, toggleMute, toggleCam } =
    useCall(user?._id ?? "", token ?? "");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) setCurrentUser(user);
  }, [loading, user, router]);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch("/api/rooms?limit=50", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setRooms(json.data);
    } finally { setRoomsLoading(false); }
  }, [token]);

  const fetchDMs = useCallback(async () => {
    if (!token) return;
    const res  = await fetch("/api/dms", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setDMs(json.data);
  }, [token]);

  const fetchFriends = useCallback(async () => {
    if (!token) return;
    const res  = await fetch("/api/friends", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setFriends(json.data);
  }, [token]);

  useEffect(() => {
    if (token) { fetchRooms(); fetchDMs(); fetchFriends(); }
  }, [token, fetchRooms, fetchDMs, fetchFriends]);

  // Pusher — global room-created events
  useEffect(() => {
    if (!token) return;
    if (typeof window !== "undefined") localStorage.setItem("callm_token", token);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const ch = pusher.subscribe(CHANNELS.global);
    ch.bind(EVENTS.ROOM_CREATED, ({ room }: { room: IRoom }) => {
      setRooms((prev) => prev.some((r) => r._id === room._id) ? prev : [room, ...prev]);
    });
    return () => { ch.unbind_all(); pusher.unsubscribe(CHANNELS.global); pusher.disconnect(); };
  }, [token]);

  async function selectRoom(roomId: string, roomOverride?: IRoom) {
    const room = roomOverride ?? [...rooms, ...dms].find((r) => r._id === roomId);
    if (!room) return;
    setActiveRoom(room);
    const res  = await fetch(`/api/rooms/${roomId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setInitialMessages(json.data);
  }

  async function createRoom(name: string, description?: string) {
    if (!token) return;
    const res  = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description }),
    });
    const json = await res.json();
    if (json.success) {
      setRooms((prev) => prev.some((r) => r._id === json.data._id) ? prev : [json.data, ...prev]);
      await selectRoom(json.data._id, json.data);
    }
  }

  async function joinRoom(roomId: string) {
    if (!token) return;
    const roomOverride = rooms.find((r) => r._id === roomId);
    const res  = await fetch(`/api/rooms/${roomId}/members`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) {
      await fetchRooms();
      if (roomOverride) await selectRoom(roomId, roomOverride);
    }
  }

  async function openDM(userId: string) {
    if (!token) return;
    const res  = await fetch("/api/dms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (json.success) {
      const dm = json.data as IRoom;
      setDMs((prev) => prev.some((d) => d._id === dm._id) ? prev : [dm, ...prev]);
      await selectRoom(dm._id, dm);
    }
  }

  if (loading || roomsLoading) {
    return (
      <div className="min-h-screen bg-[#0a0812] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-[#7a6d94]">
          <CallmLogo size="sm" showText={false} />
          <span className="text-sm font-syne">{t("loadingApp")}</span>
        </div>
      </div>
    );
  }

  if (!currentUser || !token) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0812]">
      <Sidebar
        user={currentUser}
        rooms={rooms}
        dms={dms}
        friends={friends}
        activeRoomId={activeRoom?._id}
        onSelectRoom={selectRoom}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onOpenDM={openDM}
        onLogout={() => { logout(); router.push("/login"); }}
        currentUserId={currentUser._id}
        token={token}
        onUserUpdate={setCurrentUser}
        onFriendsChange={fetchFriends}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeRoom ? (
          <ChatRoom
            room={activeRoom}
            token={token}
            currentUserId={currentUser._id}
            currentUser={currentUser}
            initialMessages={initialMessages}
            onRoomDeleted={(roomId) => {
              setRooms((prev) => prev.filter((r) => r._id !== roomId));
              setDMs((prev) => prev.filter((r) => r._id !== roomId));
              setActiveRoom(null);
            }}
            onStartCall={(type) => {
              const otherMember = (activeRoom.members as import("@/types").IUser[]).find((m) => m._id !== currentUser._id);
              if (otherMember) startCall(otherMember, type);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="mb-6">
              <CallmLogo size="lg" />
            </div>
            <p className="text-sm text-[#52525b] max-w-xs font-syne">
              {t("selectRoom")}
            </p>
          </div>
        )}
      </main>

      {/* Incoming call */}
      {incomingCall && !call && (
        <CallModal
          incoming={incomingCall}
          onAnswer={() => answerCall(incomingCall)}
          onReject={() => rejectCall(incomingCall)}
        />
      )}

      {/* Active call overlay */}
      {call && (
        <CallOverlay
          call={call}
          onEnd={endCall}
          onToggleMute={toggleMute}
          onToggleCam={toggleCam}
        />
      )}
    </div>
  );
}
