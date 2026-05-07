"use client";

import { useState, useRef } from "react";
import { IconX, IconCamera } from "./icons";
import { Avatar } from "./Avatar";
import type { IUser } from "@/types";
import { clsx } from "clsx";

interface ProfilePanelProps {
  user: IUser;
  onClose: () => void;
  onUpdate: (user: IUser) => void;
  token: string;
}

export function ProfilePanel({ user, onClose, onUpdate, token }: ProfilePanelProps) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
        setAvatar(data.data.url);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || undefined,
          avatar: avatar || undefined,
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

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-surface-1 flex flex-col h-full border-r border-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <IconX width={16} height={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar
                name={name}
                src={avatar}
                size="lg"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-8 w-8 flex items-center justify-center rounded-full bg-accent hover:bg-accent-hover text-white transition disabled:opacity-50"
              >
                <IconCamera width={14} height={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Name */}
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

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
              placeholder="Tell us about yourself…"
              className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none border border-white/5 focus:border-accent/50 transition resize-none"
            />
            <p className="text-[10px] text-zinc-600">
              {bio.length}/200
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Email
            </label>
            <div className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-sm text-zinc-500 border border-white/5">
              {user.email}
            </div>
          </div>

          {/* Member since */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Member since
            </label>
            <div className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-sm text-zinc-500 border border-white/5">
              {memberSince}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-4 py-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-white transition rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading || !name.trim()}
            className={clsx(
              "flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition",
              name.trim() && !saving
                ? "bg-accent hover:bg-accent-hover text-white"
                : "bg-accent/50 text-white cursor-not-allowed"
            )}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
