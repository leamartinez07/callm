"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { IconX, IconCamera, IconUserPlus } from "./icons";
import { Avatar } from "./Avatar";
import type { IRoom, IUser } from "@/types";
import { clsx } from "clsx";

interface RoomInfoPanelProps {
  room: IRoom;
  currentUserId: string;
  token: string;
  onClose: () => void;
  onUpdate: (room: IRoom) => void;
  onDelete: () => void;
}

const IconTrash2 = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

export function RoomInfoPanel({
  room,
  currentUserId,
  token,
  onClose,
  onUpdate,
  onDelete,
}: RoomInfoPanelProps) {
  const isOwner = (typeof room.owner === "string" ? room.owner : room.owner._id) === currentUserId;

  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || "");
  const [image, setImage] = useState(room.image);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [fullRoom, setFullRoom] = useState<IRoom | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch full room with populated members
  useEffect(() => {
    fetch(`/api/rooms/${room._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => { if (j.success) setFullRoom(j.data); })
      .catch(() => {});
  }, [room._id, token]);

  const members = useMemo(
    () => (Array.isArray((fullRoom ?? room).members) ? (fullRoom ?? room).members : []),
    [fullRoom, room]
  );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImage(data.data.url);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSearch() {
    if (searchUser.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchUser)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data);
      }
    } finally {
      setSearching(false);
    }
  }

  async function handleInviteUser(userId: string) {
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: userId,
          type: "room",
          room: room._id,
        }),
      });

      if (res.ok) {
        setSearchUser("");
        setSearchResults([]);
      }
    } catch (e) {
      console.error("Error inviting user:", e);
    }
  }

  async function handleSave() {
    if (!isOwner) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${room._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          image: image || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.data);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isOwner) return;
    if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${room._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        onDelete();
        onClose();
      }
    } catch (e) {
      console.error("Error deleting room:", e);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-surface-1 flex flex-col h-full border-l border-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Room Info</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <IconX width={16} height={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Room image */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Room Image
              </label>
              <div className="relative group">
                <div className="w-full h-32 rounded-xl bg-surface-2 border border-white/5 overflow-hidden flex items-center justify-center">
                  {image ? (
                    <img src={image} alt="room" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-zinc-600 text-xs">No image</div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 h-8 w-8 flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white transition disabled:opacity-50"
                >
                  <IconCamera width={14} height={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Name */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none border border-white/5 focus:border-accent/50 transition"
              />
            </div>
          )}

          {/* Description */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={3}
                placeholder="Room description…"
                className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none border border-white/5 focus:border-accent/50 transition resize-none"
              />
              <p className="text-[10px] text-zinc-600">
                {description.length}/200
              </p>
            </div>
          )}

          {/* Members */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Members ({members.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {members.map((member) => {
                const memberId = typeof member === "string" ? member : member._id;
                const m = typeof member === "string"
                  ? { _id: member, name: "Unknown", avatar: undefined, email: undefined }
                  : { _id: member._id, name: member.name, avatar: (member as IUser).avatar, email: (member as IUser).email };
                const isMemberOwner = memberId === (typeof room.owner === "string" ? room.owner : room.owner._id);

                return (
                  <div
                    key={memberId}
                    className="flex items-center gap-2 bg-surface-2 rounded-lg p-2"
                  >
                    <Avatar
                      name={m.name || "Unknown"}
                      src={m.avatar}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {m.name || "Unknown"}
                        {isMemberOwner && " 👑"}
                      </p>
                      <p className="text-[10px] text-zinc-600 truncate">
                        {m.email || ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invite user */}
          {isOwner && (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Invite User
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyUp={handleSearch}
                  placeholder="Search users…"
                  className="flex-1 bg-surface-2 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none border border-white/5 focus:border-accent/50 transition"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between bg-surface-2 rounded-lg p-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar name={user.name} src={user.avatar} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{user.name}</p>
                          <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInviteUser(user._id)}
                        className="h-6 w-6 flex items-center justify-center rounded text-accent hover:text-accent-hover transition"
                      >
                        <IconUserPlus width={14} height={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isOwner && (
          <div className="border-t border-white/5 px-4 py-4 space-y-2">
            <button
              onClick={handleSave}
              disabled={saving || uploading || !name.trim()}
              className={clsx(
                "w-full px-4 py-2 text-sm font-semibold rounded-xl transition",
                name.trim() && !saving
                  ? "bg-accent hover:bg-accent-hover text-white"
                  : "bg-accent/50 text-white cursor-not-allowed"
              )}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition flex items-center justify-center gap-2"
            >
              <IconTrash2 width={14} height={14} />
              Delete Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
