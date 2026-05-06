"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { clsx } from "clsx";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const content = value.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      await onSend(content);
      setValue("");
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
      <div className="flex items-end gap-2 bg-surface-2 rounded-2xl px-4 py-2.5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          disabled={disabled || sending}
          className="flex-1 bg-transparent resize-none text-sm text-zinc-200 placeholder:text-zinc-600 outline-none max-h-40 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending || disabled}
          className={clsx(
            "shrink-0 h-8 w-8 flex items-center justify-center rounded-xl transition-all",
            value.trim() && !disabled
              ? "bg-accent text-white hover:bg-accent-hover"
              : "text-zinc-600 cursor-not-allowed"
          )}
        >
          <SendHorizonal size={16} />
        </button>
      </div>
      <p className="text-[10px] text-zinc-700 mt-1 pl-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
