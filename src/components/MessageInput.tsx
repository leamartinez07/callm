"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { IconSend, IconPaperclip } from "./icons";
import { clsx } from "clsx";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  token?: string;
}

export function MessageInput({ onSend, disabled, token }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

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
        const url = data.data.url;
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        let content = value.trim();
        if (isImage) {
          content += (content ? " " : "") + `[image:${url}]`;
        } else if (isVideo) {
          content += (content ? " " : "") + `[video:${url}]`;
        } else {
          content += (content ? " " : "") + `[file:${file.name}:${url}]`;
        }

        setValue(content);
        if (isImage) {
          setPreview({ url, name: file.name });
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSend() {
    const content = value.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      await onSend(content);
      setValue("");
      setPreview(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  return (
    <div className="px-4 pb-4 pt-2 border-t border-white/5">
      {preview && (
        <div className="mb-2 relative inline-block">
          <img
            src={preview.url}
            alt="preview"
            className="max-w-full max-h-32 rounded-lg"
          />
          <button
            onClick={() => {
              setPreview(null);
              setValue(value.replace(`[image:${preview.url}]`, "").trim());
            }}
            className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 transition"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 bg-surface-2 rounded-2xl px-4 py-2.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending || uploading}
          className="shrink-0 h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition disabled:opacity-50"
          title="Attach file"
        >
          <IconPaperclip width={16} height={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          disabled={disabled || sending || uploading}
          className="flex-1 bg-transparent resize-none text-sm text-zinc-200 placeholder:text-zinc-600 outline-none max-h-40 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending || disabled || uploading}
          className={clsx(
            "shrink-0 h-8 w-8 flex items-center justify-center rounded-xl transition-all",
            value.trim() && !disabled && !uploading
              ? "bg-accent text-white hover:bg-accent-hover"
              : "text-zinc-600 cursor-not-allowed"
          )}
        >
          <IconSend width={16} height={16} />
        </button>
      </div>
      <p className="text-[10px] text-zinc-700 mt-1 pl-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
