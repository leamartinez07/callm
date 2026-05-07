"use client";

import { useState } from "react";
import { IconChat, IconPlus, IconSearch, IconLogout } from "./icons";
import { clsx } from "clsx";
import { Avatar } from "./Avatar";
import { RoomCard } from "./RoomCard";
import { ProfilePanel } from "./ProfilePanel";
import { InviteNotifications } from "./InviteNotifications";
import type { IRoom, IUser } from "@/types";

interface SidebarProps {
  user: IUser;
  rooms: IRoom[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, description?: string) => Promise<void>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onLogout: () => void;
  currentUserId: string;
  token: string;
  onUserUpdate: (user: IUser) => void;
}

export function Sidebar({
  user,
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  onLogout,
  currentUserId,
  token,
  onUserUpdate,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const myRooms = filtered.filter((r) => {
    const members = r.members as unknown as Array<{ _id: string } | string>;
    return members.some((m) => (typeof m === "string" ? m : m._id) === currentUserId);
  });

  const otherRooms = filtered.filter((r) => {
    const members = r.members as unknown as Array<{ _id: string } | string>;
    return !members.some((m) => (typeof m === "string" ? m : m._id) === currentUserId);
  });

  async function handleCreate() {
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      await onCreateRoom(newRoomName.trim(), newRoomDesc.trim() || undefined);
      setShowCreate(false);
      setNewRoomName("");
      setNewRoomDesc("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-surface-1 border-r border-white/5">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center gap-2">
        <IconChat width={18} height={18} className="text-accent shrink-0" />
        <span className="font-bold text-white text-sm tracking-tight">ChatFlow</span>
        <InviteNotifications token={token} currentUserId={currentUserId} />
        <button
          onClick={() => setShowCreate(true)}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
          title="New room"
        >
          <IconPlus width={16} height={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-1.5">
          <IconSearch width={13} height={13} className="text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="flex-1 bg-transparent text-xs text-zinc-300 placeholder:text-zinc-600 outline-none"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {myRooms.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Your rooms
            </p>
            {myRooms.map((r) => (
              <RoomCard
                key={r._id}
                room={r}
                isActive={r._id === activeRoomId}
                isMember
                onClick={() => onSelectRoom(r._id)}
              />
            ))}
          </div>
        )}

        {otherRooms.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Discover
            </p>
            {otherRooms.map((r) => (
              <RoomCard
                key={r._id}
                room={r}
                isActive={r._id === activeRoomId}
                isMember={false}
                onClick={() => onJoinRoom(r._id)}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="px-3 text-xs text-zinc-600">No rooms found.</p>
        )}
      </div>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/5 flex items-center gap-2.5">
        <button
          onClick={() => setShowProfile(true)}
          className="flex-1 flex items-center gap-2.5 min-w-0 hover:opacity-70 transition"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-lg object-cover shrink-0"
            />
          ) : (
            <Avatar name={user.name} size="sm" online />
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-zinc-200 truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition"
          title="Logout"
        >
          <IconLogout width={14} height={14} />
        </button>
      </div>

      {/* Create room modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Create a room</h2>
            <div className="space-y-3">
              <input
                autoFocus
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Room name"
                maxLength={50}
                className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none border border-transparent focus:border-accent/50"
              />
              <input
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                placeholder="Description (optional)"
                maxLength={200}
                className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none border border-transparent focus:border-accent/50"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newRoomName.trim() || creating}
                className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-xl transition disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile panel */}
      {showProfile && (
        <ProfilePanel
          user={user}
          token={token}
          onClose={() => setShowProfile(false)}
          onUpdate={onUserUpdate}
        />
      )}
    </aside>
  );
}
