"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { IconSend, IconPaperclip } from "./icons";
import { useLocale } from "@/hooks/useLocale";
import { clsx } from "clsx";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  token?: string;
}

export function MessageInput({ onSend, disabled, token }: MessageInputProps) {
  const { t } = useLocale();
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
    <div className="px-4 pb-4 pt-3 border-t border-[#252040] bg-[#100e1c]/80">
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
      <div className="flex items-end gap-2 bg-[#16132a] border border-[#252040] focus-within:border-[#9d5bf4]/40 rounded-2xl px-3 py-2.5 transition">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending || uploading}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-[#52525b] hover:text-[#c084fc] hover:bg-[#9d5bf4]/10 transition disabled:opacity-40"
          title="Attach file"
        >
          <IconPaperclip width={15} height={15} />
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
          placeholder={t("typeMessage")}
          disabled={disabled || sending || uploading}
          className="flex-1 bg-transparent resize-none text-sm text-[#d4d4d8] placeholder:text-[#52525b] outline-none max-h-40 leading-relaxed py-0.5"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending || disabled || uploading}
          className={clsx(
            "shrink-0 h-8 w-8 flex items-center justify-center rounded-xl transition-all",
            value.trim() && !disabled && !uploading
              ? "text-white shadow-sm shadow-[#9d5bf4]/30"
              : "bg-[#1c1830] text-[#52525b] cursor-not-allowed"
          )}
          style={value.trim() && !disabled && !uploading ? { background: "linear-gradient(135deg,#9d5bf4,#c084fc)" } : undefined}
        >
          <IconSend width={15} height={15} />
        </button>
      </div>
      <p className="text-[10px] text-[#3a3260] mt-1 pl-1">
        {t("enterSend")}
      </p>
    </div>
  );
}
