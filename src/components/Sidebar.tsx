"use client";

import { useState, useEffect, useCallback } from "react";
import { CallmLogo } from "./CallmLogo";
import { Avatar } from "./Avatar";
import { RoomCard } from "./RoomCard";
import { ProfilePanel } from "./ProfilePanel";
import { InviteNotifications } from "./InviteNotifications";
import {
  IconPlus, IconSearch, IconLogout, IconUserPlus, IconX, IconCheck, IconSettings,
} from "./icons";
import { useLocale } from "@/hooks/useLocale";
import type { IRoom, IUser, IFriend } from "@/types";

interface SidebarProps {
  user: IUser;
  rooms: IRoom[];
  dms: IRoom[];
  friends: IFriend[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, description?: string) => Promise<void>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onOpenDM: (userId: string) => Promise<void>;
  onLogout: () => void;
  currentUserId: string;
  token: string;
  onUserUpdate: (user: IUser) => void;
  onFriendsChange: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 mb-1.5">
      <span className="text-[10px] font-syne font-bold uppercase tracking-[0.2em] text-[#7a6d94]">
        {children}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-[#3a3260] to-transparent" />
    </div>
  );
}

function DMItem({ dm, currentUserId, isActive, onClick }: {
  dm: IRoom; currentUserId: string; isActive: boolean; onClick: () => void;
}) {
  const { t } = useLocale();
  const other = (dm.members as IUser[]).find((m) => m._id !== currentUserId);
  if (!other) return null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${
        isActive ? "bg-[#9d5bf4]/15" : "hover:bg-white/[0.04]"
      }`}
    >
      <div className="relative shrink-0">
        {other.avatar
          ? <img src={other.avatar} alt={other.name} className="w-7 h-7 rounded-lg object-cover" />
          : <Avatar name={other.name} size="sm" />}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#100e1c]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-[#d4d4d8]"}`}>{other.name}</p>
        <p className="text-[10px] text-[#52525b] truncate">{dm.lastMessage?.content ?? t("typeMessage")}</p>
      </div>
    </button>
  );
}

export function Sidebar({
  user, rooms, dms, friends, activeRoomId,
  onSelectRoom, onCreateRoom, onJoinRoom, onOpenDM,
  onLogout, currentUserId, token, onUserUpdate, onFriendsChange,
}: SidebarProps) {
  const { locale, t, toggle: toggleLocale } = useLocale();
  const [search, setSearch]         = useState("");
  const [tab, setTab]               = useState<"rooms" | "dms" | "friends">("rooms");
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [creating, setCreating]     = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [friendResults, setFriendResults] = useState<IUser[]>([]);
  const [searchingFriend, setSearchingFriend] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<{ _id: string; from: IUser }[]>([]);

  const fetchPending = useCallback(async () => {
    const res = await fetch("/api/invites?type=friend&status=pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) setPendingInvites(json.data);
  }, [token]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  useEffect(() => {
    if (!friendQuery.trim()) { setFriendResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingFriend(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(friendQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setFriendResults(json.data.filter((u: IUser) => u._id !== currentUserId));
      } finally { setSearchingFriend(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [friendQuery, token, currentUserId]);

  async function sendFriendRequest(userId: string) {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    setShowAddFriend(false);
    setFriendQuery("");
  }

  async function respondToInvite(id: string, status: "accepted" | "declined") {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchPending();
    if (status === "accepted") onFriendsChange();
  }

  async function handleCreate() {
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      await onCreateRoom(newRoomName.trim(), newRoomDesc.trim() || undefined);
      setShowCreate(false); setNewRoomName(""); setNewRoomDesc("");
    } finally { setCreating(false); }
  }

  const myRooms    = rooms.filter((r) => r.type !== "direct" && (r.members as Array<IUser | string>).some((m) => (typeof m === "string" ? m : m._id) === currentUserId));
  const otherRooms = rooms.filter((r) => r.type !== "direct" && !(r.members as Array<IUser | string>).some((m) => (typeof m === "string" ? m : m._id) === currentUserId));
  const q = search.toLowerCase();
  const filteredMy    = myRooms.filter((r) => r.name.toLowerCase().includes(q));
  const filteredOther = otherRooms.filter((r) => r.name.toLowerCase().includes(q));
  const filteredDMs   = dms.filter((dm) => {
    const o = (dm.members as IUser[]).find((m) => m._id !== currentUserId);
    return o?.name.toLowerCase().includes(q);
  });
  const filteredFriends = friends.filter((f) => f.user.name.toLowerCase().includes(q));

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-[#100e1c] border-r border-[#252040]">
      <div className="top-stripe" />

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[#252040] flex items-center gap-2">
        <CallmLogo size="sm" />
        <div className="flex-1" />
        {/* Language toggle — prominent, right in the header */}
        <button
          onClick={toggleLocale}
          className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-[#1c1830] border border-[#2e2950] hover:border-[#9d5bf4]/50 text-[#7a6d94] hover:text-[#c084fc] transition text-[10px] font-syne font-bold"
          title="Toggle language"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          {locale.toUpperCase()}
        </button>
        <InviteNotifications token={token} currentUserId={currentUserId} />
        <button
          onClick={() => setShowCreate(true)}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#7a6d94] hover:text-[#c084fc] transition"
          title={t("newRoom")}
        >
          <IconPlus width={15} height={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#252040]">
        {(["rooms", "dms", "friends"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 text-[10px] font-syne font-bold uppercase tracking-widest transition relative ${
              tab === tabKey ? "text-[#c084fc]" : "text-[#52525b] hover:text-[#7a6d94]"
            }`}
          >
            {tabKey === "friends" && pendingInvites.length > 0 && (
              <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-[#e879f9]" />
            )}
            {t(tabKey as "rooms" | "dms" | "friends")}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 bg-[#1c1830] border border-[#2e2950] rounded-xl px-3 py-1.5">
          <IconSearch width={12} height={12} className="text-[#52525b] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "dms" ? t("searchDMs") : tab === "friends" ? t("searchFriends") : t("searchRooms")}
            className="flex-1 bg-transparent text-xs text-[#d4d4d8] placeholder:text-[#52525b] outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">

        {tab === "rooms" && (
          <>
            {filteredMy.length > 0 && (
              <div>
                <SectionLabel>{t("yourRooms")}</SectionLabel>
                {filteredMy.map((r) => (
                  <RoomCard key={r._id} room={r} isActive={r._id === activeRoomId} isMember onClick={() => onSelectRoom(r._id)} />
                ))}
              </div>
            )}
            {filteredOther.length > 0 && (
              <div>
                <SectionLabel>{t("discover")}</SectionLabel>
                {filteredOther.map((r) => (
                  <RoomCard key={r._id} room={r} isActive={r._id === activeRoomId} isMember={false} onClick={() => onJoinRoom(r._id)} />
                ))}
              </div>
            )}
            {filteredMy.length === 0 && filteredOther.length === 0 && (
              <p className="px-3 text-xs text-[#52525b] py-4 text-center">{t("noRoomsFound")}</p>
            )}
          </>
        )}

        {tab === "dms" && (
          <div>
            <SectionLabel>{t("directMessages")}</SectionLabel>
            {filteredDMs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[#52525b] mb-2">{t("noConversations")}</p>
                <p className="text-[10px] text-[#3a3260]">{t("goToFriends")}</p>
              </div>
            ) : (
              filteredDMs.map((dm) => (
                <DMItem key={dm._id} dm={dm} currentUserId={currentUserId} isActive={dm._id === activeRoomId} onClick={() => onSelectRoom(dm._id)} />
              ))
            )}
          </div>
        )}

        {tab === "friends" && (
          <div className="space-y-3">
            {pendingInvites.length > 0 && (
              <div>
                <SectionLabel>{t("requests")} — {pendingInvites.length}</SectionLabel>
                {pendingInvites.map((inv) => (
                  <div key={inv._id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1c1830] border border-[#2e2950] mb-1.5">
                    <Avatar name={inv.from.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#d4d4d8] truncate">{inv.from.name}</p>
                      <p className="text-[10px] text-[#52525b]">{t("friendRequest")}</p>
                    </div>
                    <button onClick={() => respondToInvite(inv._id, "accepted")} className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#9d5bf4]/20 hover:bg-[#9d5bf4]/40 text-[#c084fc] transition">
                      <IconCheck width={11} height={11} />
                    </button>
                    <button onClick={() => respondToInvite(inv._id, "declined")} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-[#52525b] hover:text-red-400 transition">
                      <IconX width={11} height={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAddFriend(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#2e2950] hover:border-[#9d5bf4]/40 hover:bg-[#9d5bf4]/5 text-[#52525b] hover:text-[#c084fc] transition text-xs font-medium"
            >
              <IconUserPlus width={13} height={13} />
              {t("addFriend")}
            </button>

            {filteredFriends.length > 0 && (
              <div>
                <SectionLabel>{t("friends")} — {friends.length}</SectionLabel>
                {filteredFriends.map((f) => (
                  <div key={f._id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition group">
                    {f.user.avatar
                      ? <img src={f.user.avatar} alt={f.user.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                      : <Avatar name={f.user.name} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#d4d4d8] truncate">{f.user.name}</p>
                    </div>
                    <button
                      onClick={() => { setTab("dms"); onOpenDM(f.user._id); }}
                      title="Message"
                      className="opacity-0 group-hover:opacity-100 transition w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#9d5bf4]/20 text-[#9d5bf4]"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {friends.length === 0 && (
              <p className="text-center text-xs text-[#52525b] py-4">{t("noFriends")}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pt-3 pb-3 border-t border-[#252040] space-y-2.5">
        {/* User card */}
        <button
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-[#16132a] transition group"
        >
          <div className="relative shrink-0">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-xl object-cover" />
              : <Avatar name={user.name} size="sm" online />}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0812]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-[#d4d4d8] truncate">{user.name}</p>
            <p className="text-xs text-[#52525b] truncate">{user.email}</p>
          </div>
          <IconSettings width={14} height={14} className="text-[#52525b] group-hover:text-[#9d5bf4] transition shrink-0" />
        </button>

        {/* Sign out */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#1c1830] border border-[#2e2950] hover:bg-red-500/10 hover:border-red-500/30 text-[#7a6d94] hover:text-red-400 transition"
        >
          <IconLogout width={14} height={14} />
          <span className="text-sm font-semibold">{t("signOut")}</span>
        </button>
      </div>

      {/* Create room modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16132a] border border-[#252040] rounded-2xl w-full max-w-sm p-6 shadow-[0_0_60px_rgba(157,91,244,0.15)]">
            <h2 className="text-base font-syne font-bold text-white mb-4">{t("createRoom")}</h2>
            <div className="space-y-3 mb-5">
              <input autoFocus value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder={t("roomName")} maxLength={50} className="w-full bg-[#1c1830] border border-[#2e2950] focus:border-[#9d5bf4]/60 rounded-xl px-4 py-2.5 text-sm text-[#d4d4d8] placeholder:text-[#52525b] outline-none transition" />
              <input value={newRoomDesc} onChange={(e) => setNewRoomDesc(e.target.value)} placeholder={t("roomDescription")} maxLength={200} className="w-full bg-[#1c1830] border border-[#2e2950] focus:border-[#9d5bf4]/60 rounded-xl px-4 py-2.5 text-sm text-[#d4d4d8] placeholder:text-[#52525b] outline-none transition" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[#7a6d94] hover:text-white transition">{t("cancel")}</button>
              <button onClick={handleCreate} disabled={!newRoomName.trim() || creating} className="px-5 py-2 text-sm font-syne font-bold text-white rounded-xl disabled:opacity-40 transition" style={{ background: "linear-gradient(135deg,#9d5bf4,#e879f9)" }}>
                {creating ? t("creating") : t("create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add friend modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16132a] border border-[#252040] rounded-2xl w-full max-w-sm p-6 shadow-[0_0_60px_rgba(157,91,244,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-syne font-bold text-white">{t("addFriendTitle")}</h2>
              <button onClick={() => { setShowAddFriend(false); setFriendQuery(""); }} className="text-[#52525b] hover:text-white"><IconX width={16} height={16} /></button>
            </div>
            <input autoFocus value={friendQuery} onChange={(e) => setFriendQuery(e.target.value)} placeholder={t("searchByName")} className="w-full bg-[#1c1830] border border-[#2e2950] focus:border-[#9d5bf4]/60 rounded-xl px-4 py-2.5 text-sm text-[#d4d4d8] placeholder:text-[#52525b] outline-none transition mb-3" />
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {searchingFriend && <p className="text-xs text-[#52525b] text-center py-3">{t("searching")}</p>}
              {!searchingFriend && friendResults.length === 0 && friendQuery.trim() && (
                <p className="text-xs text-[#52525b] text-center py-3">{t("noUsersFound")}</p>
              )}
              {friendResults.map((u) => (
                <div key={u._id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#1c1830] transition">
                  <Avatar name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#d4d4d8] truncate">{u.name}</p>
                    <p className="text-xs text-[#52525b] truncate">{u.email}</p>
                  </div>
                  <button onClick={() => sendFriendRequest(u._id)} className="text-xs font-syne font-bold text-[#c084fc] bg-[#9d5bf4]/20 hover:bg-[#9d5bf4]/40 px-3 py-1.5 rounded-lg transition">{t("add")}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <ProfilePanel user={user} token={token} onClose={() => setShowProfile(false)} onUpdate={onUserUpdate} />
      )}
    </aside>
  );
}
