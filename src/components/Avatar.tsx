"use client";

import { clsx } from "clsx";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}

const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base" };

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function hue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

export function Avatar({ name, src, size = "md", online }: AvatarProps) {
  const bg = `hsl(${hue(name)}, 55%, 40%)`;
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx("rounded-full object-cover", sizes[size])}
        />
      ) : (
        <div
          className={clsx("rounded-full flex items-center justify-center font-semibold text-white", sizes[size])}
          style={{ background: bg }}
        >
          {initials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-[#111118]",
            online ? "bg-emerald-400" : "bg-zinc-600"
          )}
        />
      )}
    </div>
  );
}
