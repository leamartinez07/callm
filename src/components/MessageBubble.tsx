"use client";

import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Avatar } from "./Avatar";
import { IconPaperclip } from "./icons";
import { useLocale } from "@/hooks/useLocale";
import type { IMessage } from "@/types";
import { clsx } from "clsx";

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  showSender: boolean; // show avatar + name when first in a group
  onEdit?: (newContent: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function formatTime(dateStr: string, yesterdayLabel: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `${yesterdayLabel} ${format(d, "HH:mm")}`;
  return format(d, "d MMM HH:mm");
}

function parseMessageContent(content: string) {
  if (content.startsWith("[image:")) {
    const match = content.match(/^\[image:(.+?)\]/);
    if (match) return { type: "image", url: match[1], text: content.slice(match[0].length).trim() };
  }
  if (content.startsWith("[video:")) {
    const match = content.match(/^\[video:(.+?)\]/);
    if (match) return { type: "video", url: match[1], text: content.slice(match[0].length).trim() };
  }
  if (content.startsWith("[file:")) {
    const match = content.match(/^\[file:(.+?):(.+?)\]/);
    if (match) return { type: "file", name: match[1], url: match[2], text: content.slice(match[0].length).trim() };
  }
  return { type: "text", text: content };
}

export function MessageBubble({ message, isOwn, showSender, onEdit, onDelete }: MessageBubbleProps) {
  const { t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleEditSave() {
    if (!onEdit || !editValue.trim()) return;
    setSaving(true);
    try {
      await onEdit(editValue.trim());
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setConfirmDelete(false);
    await onDelete();
  }

  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const senderName = typeof message.sender === "string" ? message.sender : message.sender.name;
  const senderAvatar = typeof message.sender === "string" ? undefined : message.sender.avatar;

  const parsed = parseMessageContent(message.content);

  return (
    <div
      className={clsx("flex gap-2.5 px-4 py-0.5 group relative", isOwn && "flex-row-reverse", !showSender && "mt-0.5")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar placeholder to keep alignment */}
      {showSender ? (
        <Avatar name={senderName} src={senderAvatar} size="sm" />
      ) : (
        <div className="w-7 shrink-0" />
      )}

      {/* Hover actions (edit/delete) */}
      {isOwn && hovered && !isEditing && (
        <div className={clsx(
          "flex items-center gap-1 self-center shrink-0",
          isOwn ? "mr-1" : "ml-1"
        )}>
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
              >{t("deleteConfirm")}</button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 text-[10px] text-zinc-500 hover:text-white rounded transition"
              >{t("cancel")}</button>
            </>
          ) : (
            <>
              {onEdit && (
                <button
                  onClick={() => { setEditValue(message.content); setIsEditing(true); }}
                  className="h-6 w-6 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition"
                  title="Edit"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="h-6 w-6 flex items-center justify-center rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className={clsx("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        {showSender && (
          <div className={clsx("flex items-baseline gap-2 mb-0.5", isOwn && "flex-row-reverse")}>
            <span className="text-xs font-semibold text-zinc-300">{senderName}</span>
            <span className="text-[10px] text-zinc-600">{formatTime(message.createdAt, t("yesterday"))}</span>
          </div>
        )}

        {parsed.type === "image" && (
          <a
            href={parsed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl overflow-hidden mb-1"
          >
            <img
              src={parsed.url}
              alt="attachment"
              className="max-w-xs h-auto rounded-2xl"
            />
          </a>
        )}

        {parsed.type === "video" && (
          <video
            src={parsed.url}
            controls
            className="max-w-xs h-auto rounded-2xl mb-1"
          />
        )}

        {parsed.type === "file" && (
          <a
            href={parsed.url}
            download
            className={clsx(
              "rounded-2xl px-3.5 py-2 text-sm flex items-center gap-2 mb-1 no-underline hover:underline",
              isOwn
                ? "bg-accent text-white"
                : "bg-surface-2 text-zinc-200"
            )}
          >
            <IconPaperclip width={14} height={14} />
            {parsed.name}
          </a>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-1.5 w-full max-w-xs">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                if (e.key === "Escape") setIsEditing(false);
              }}
              rows={2}
              autoFocus
              className="w-full bg-[#1c1830] rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none border border-[#9d5bf4]/50 resize-none"
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-xs text-[#7a6d94] hover:text-white transition"
              >{t("cancel")}</button>
              <button
                onClick={handleEditSave}
                disabled={saving || !editValue.trim()}
                className="px-2.5 py-1 text-xs font-semibold text-white rounded-lg transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#9d5bf4,#c084fc)" }}
              >{saving ? t("saving") : t("save")}</button>
            </div>
          </div>
        ) : (
          (parsed.type === "text" || parsed.text) && (
            <div
              className={clsx(
                "rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
                isOwn
                  ? "text-white rounded-tr-sm shadow-sm"
                  : "bg-[#16132a] border border-[#252040] text-[#d4d4d8] rounded-tl-sm"
              )}
              style={isOwn ? { background: "linear-gradient(135deg,#9d5bf4 0%,#c084fc 100%)" } : undefined}
            >
              {parsed.text || message.content}
            </div>
          )
        )}

        {!showSender && !isEditing && (
          <span className={clsx("text-[10px] text-zinc-600 mt-0.5 px-1", isOwn && "text-right")}>
            {formatTime(message.createdAt, t("yesterday"))}
          </span>
        )}
        {message.editedAt && !isEditing && (
          <span className="text-[10px] text-zinc-600 px-1">{t("edited")}</span>
        )}
      </div>
    </div>
  );
}
